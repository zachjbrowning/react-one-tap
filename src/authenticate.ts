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
  return await new Promise((resolve) => {
    const header = jwtToken.split(".")[0];
    const { kid } = JSON.parse(Buffer.from(header, "base64").toString());

    jwt.verify(
      jwtToken,
      googleOAuthCerts[kid],
      {
        iss: "https://accounts.google.com",
        aud: clientId,
      },
      (_error?: Error, profile?: Profile) => resolve(profile)
    );
  });
}

// From https://www.googleapis.com/oauth2/v1/certs
const googleOAuthCerts: Record<string, string> = {
  c1892eb49d7ef9adf8b2e14c05ca0d032714a237:
    "-----BEGIN CERTIFICATE-----\nMIIDJjCCAg6gAwIBAgIIDGwDEGOzz3UwDQYJKoZIhvcNAQEFBQAwNjE0MDIGA1UE\nAxMrZmVkZXJhdGVkLXNpZ25vbi5zeXN0ZW0uZ3NlcnZpY2VhY2NvdW50LmNvbTAe\nFw0yMTEyMDYxNTIxMzJaFw0yMTEyMjMwMzM2MzJaMDYxNDAyBgNVBAMTK2ZlZGVy\nYXRlZC1zaWdub24uc3lzdGVtLmdzZXJ2aWNlYWNjb3VudC5jb20wggEiMA0GCSqG\nSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDFYMkHDDEtTwpTTDZuqKJc8+s4Dt9+YXuD\nvw78Pos6/zRvN5HLJffOPMhw4jS0tl8UR8U7wK+nNPMHWHls2KcMDgxf08UzI0GN\nztDiHtBK1hmg5FjoppzfXghCTB9Uze7iFsilW9WCZqlgRIak98qH9I+vy1G9qsOg\nSdcbprnTU2Lw99mDjhoJt7SQnKCXhhmO8sAESQfX0fE+JeiPEkRZ57WVOjIMl8zy\n1mo1NqXm7cXwyTftGGQxYwzWDKm+Xba3owNQQ6aqnlK3BZaCjsoMnXucNewzpNDX\nSvGh+RCbkjazC9+iyvhCvcahQKsTXNec/A1kn8/6xDOI4VF3fp5nAgMBAAGjODA2\nMAwGA1UdEwEB/wQCMAAwDgYDVR0PAQH/BAQDAgeAMBYGA1UdJQEB/wQMMAoGCCsG\nAQUFBwMCMA0GCSqGSIb3DQEBBQUAA4IBAQAjHaApS7hjtOH1JCD4HU/m+w5J5t+T\nPRP0678V1qVTWOsKGNnEb+huG6+s2bCtWQoQs3TfPV2SgUf2wvCHG0tWpiIclsEK\nWiy68eGbM8NCRfQlPCvuS5WBBzQI7OOf2J2JovrBCk7PXe81kDBXoXyMukli77LA\n/r5TbpkOlAY1s0ePaBu4ABjUvjMC7ll3HhOPCNF+SpnoVxw2Iq+5LBy7ckOvT+7t\n2kah329K3VYCw0fdg2YQvSQkypZx2dPdbpbZCSawFmXM+XNPYFU8tREwSBZmg4fr\nLqFNLhEvReJiCVfZeSefp9kdQnhFVx916yzV7XznsDr+gquyjw6mEWxk\n-----END CERTIFICATE-----\n",
  "9341abc4092b6fc038e403c91022dd3e44539b56":
    "-----BEGIN CERTIFICATE-----\nMIIDJjCCAg6gAwIBAgIIWIHKARQ21S4wDQYJKoZIhvcNAQEFBQAwNjE0MDIGA1UE\nAxMrZmVkZXJhdGVkLXNpZ25vbi5zeXN0ZW0uZ3NlcnZpY2VhY2NvdW50LmNvbTAe\nFw0yMTExMjgxNTIxMzJaFw0yMTEyMTUwMzM2MzJaMDYxNDAyBgNVBAMTK2ZlZGVy\nYXRlZC1zaWdub24uc3lzdGVtLmdzZXJ2aWNlYWNjb3VudC5jb20wggEiMA0GCSqG\nSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC6a9/t9THDObvqPjWON37wcKC4temTNzD5\nXMf66vU6SZZY+1Dxbf/I+6ErkrfkjRqSm1a2odPMrKsJg9esgJjngPQcanjJwsNJ\n7Yf8pNkZxM98vA2FNbJz4DH/tk7z03I83GfrIiguGoRrxDqAxQhHGTAvPQ9a0Yaf\nyoUIH/2NQU+NOJFsnzsLws1ijfDAeIElB84XdA5/jqBWgse/yoz7ZrbupByX1/eh\nlWWbwbC2+PoToCd9mZ6GTNlnA4nJ/UW8nFVpggTkwtyxj5jABq0WAv+6vAIVunjC\nv0e0j/4KZT8CcXRoA4cJ1FEkJeYAWAq1xC92LzZSAkg+OD9lsy1TAgMBAAGjODA2\nMAwGA1UdEwEB/wQCMAAwDgYDVR0PAQH/BAQDAgeAMBYGA1UdJQEB/wQMMAoGCCsG\nAQUFBwMCMA0GCSqGSIb3DQEBBQUAA4IBAQB/OWRda3KEDX6yR1jT508BDzFHpVOF\nLMwLzFpBvf2D9CGgxqy4u+p6vLM/2oy230LyRVWe/Q/D7U4OgEgb2bfpjMe+Su2X\nFXYZKBHJnhqRFUveJWkBHkBMscITNUdSEMVjZ0C2WDvF4Uv99yqLP3KQ1lOZC8Ok\npoCntubg4foAiCFoGOzCzYlCWsgEemwDr6aQnPDBVBARh4mAfyUQjwYI0hvbCU5h\nc+1QoV4McDI0+GiCU4CePCDpIaVattImnpmvfXbLnB0TbUUs1vw52dfwpluO0ija\ndVhoFnodjCXhs94tNJcKHfeFonrC3TzYIG7Z7MCs/linvhmPSt4CVJDz\n-----END CERTIFICATE-----\n",
};
