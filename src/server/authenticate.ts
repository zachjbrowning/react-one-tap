import type { TokenPayload } from "google-auth-library";
import { OAuth2Client } from "google-auth-library";
import { IncomingMessage } from "http";

type Authenticated = {
  status: 200;
  message?: undefined;
  profile: TokenPayload;
};
type NotAuthenticated = {
  status: 401 | 403;
  message: string;
  profile?: undefined;
};

export default async function authenticate({
  clientId,
  req,
}: {
  clientId: string;
  req: IncomingMessage;
}): Promise<Authenticated | NotAuthenticated> {
  if (!clientId) throw new Error("Missing clientId");

  const { authorization } = req.headers;
  if (!authorization)
    return { status: 401, message: "No authorization header" };

  const idToken = authorization?.match(/Bearer (.*)/)?.[1];
  if (!idToken) {
    return {
      status: 401,
      message: "Authorization header not using Bearer token",
    };
  }

  const profile = await verify({ clientId, idToken });
  return profile
    ? { status: 200, profile }
    : { status: 403, message: "Access token invalid, expired, or revoked" };
}

async function verify({
  clientId,
  idToken,
}: {
  clientId: string;
  idToken: string;
}) {
  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    return ticket.getPayload();
  } catch {
    return;
  }
}
