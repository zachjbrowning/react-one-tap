import type { TokenPayload } from "google-auth-library";
import { OAuth2Client } from "google-auth-library";
import { IncomingHttpHeaders } from "http";

export default async function authenticate({
  clientId,
  req,
}: {
  clientId: string;
  req: { headers: IncomingHttpHeaders };
}): Promise<
  | { status: 200; message?: undefined; profile: TokenPayload }
  | { status: 401 | 403; message: string; profile?: undefined }
> {
  if (!clientId) throw new Error("Missing clientId");

  const { authorization } = req.headers;
  if (!authorization)
    return { status: 401, message: "No authorization header" };

  const token = authorization?.match(/Bearer (.*)/)?.[1];
  if (!token)
    return {
      status: 401,
      message: "Authorization header not using Bearer token",
    };

  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    });
    const profile = ticket.getPayload();
    return profile
      ? { status: 200, profile }
      : { status: 403, message: "Access token invalid, expired, or revokes" };
  } catch {
    return {
      status: 403,
      message: "Access token invalid, expired, or revokes",
    };
  }
}
