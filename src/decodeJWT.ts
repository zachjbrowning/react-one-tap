import { Profile } from "../types";

export default function decodeJWT(token: string | null): Profile | undefined {
  if (!token) return;

  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );

  try {
    const profile = JSON.parse(json);
    const { exp } = profile;
    const isExpired = exp * 1000 < Date.now();
    return isExpired ? undefined : profile;
  } catch (error) {
    return;
  }
}
