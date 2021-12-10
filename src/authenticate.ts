import { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import { Profile } from "./types";

type Authenticated = {
  status: 200;
  message?: undefined;
  profile: Profile;
};

type NotAuthenticated = {
  status: 401 | 403;
  message: string;
  profile?: never;
};

// Express, Connect, etc
type NodeReqeust = {
  headers: IncomingMessage["headers"];
};
// CloudFlare workers, Next.js middleware, etc
type FetchRequest = {
  headers: {
    get: (name: string) => string | null;
  };
};

export default async function authenticate({
  clientId,
  request: { headers },
}: {
  clientId: string;
  request: NodeReqeust | FetchRequest;
}): Promise<Authenticated | NotAuthenticated> {
  if (!clientId) throw new Error("Missing clientId");

  const authorization =
    "authorization" in headers
      ? headers.authorization
      : headers.get instanceof Function
      ? headers.get("authorization")
      : null;
  if (!authorization)
    return { status: 401, message: "No authorization header" };

  const bearerToken = authorization?.match(/Bearer (.*)/)?.[1]?.trim();
  if (!bearerToken) {
    return {
      status: 401,
      message: "Authorization header not using Bearer token",
    };
  }

  const profile = await verify({ clientId, jwtToken: bearerToken });
  return profile
    ? { status: 200, profile }
    : { status: 403, message: "Access token invalid, expired, or revoked" };
}

async function verify({
  clientId,
  jwtToken,
}: {
  clientId: string;
  jwtToken: string;
}): Promise<Profile | undefined> {
  const header = jwtToken.split(".")[0];
  const { kid } = JSON.parse(Buffer.from(header, "base64").toString());
  const certificate = await getCertificate(kid);
  return await new Promise((resolve) => {
    jwt.verify(
      jwtToken,
      certificate,
      {
        iss: "https://accounts.google.com",
        aud: clientId,
      },
      (_error?: Error, profile?: Profile) => resolve(profile)
    );
  });
}

async function getCertificate(name: string): Promise<string> {
  if (!loading) loading = loadCerificates();
  try {
    return (await loading)[name];
  } catch (error) {
    loading = undefined;
    throw error;
  }
}

let loading: Promise<Record<string, string>> | undefined;

async function loadCerificates(): Promise<Record<string, string>> {
  const _fetch = typeof fetch === "function" ? fetch : require("node-fetch");
  const response = await _fetch("https://www.googleapis.com/oauth2/v1/certs");
  if (!response.ok)
    throw new Error(`${response.status} ${response.statusText}`);
  return (await response.json()) as Record<string, string>;
}
