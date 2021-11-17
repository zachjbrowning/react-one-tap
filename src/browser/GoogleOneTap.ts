import * as React from "react";
import decodeJWT from "./decodeJWT";
import OneTapContext from "./OneTapContext";
import { OneTapOptions } from "./OneTapOptions";
import { Profile } from "./Profile";
import useGoogleAPI from "./useGoogleAPI";
import useLocalStorage from "./useLocalStorage";

// Ask user to re-authenticate 5 mintues before their session is about to
// expire.
const defaultReauthenticate = "5m";

export default function GoogleOneTap({
  children,
  ...options
}: {
  children:
    | React.ReactNode
    | ((context: typeof OneTapContext) => React.ReactNode);
} & OneTapOptions) {
  const { clearToken, setToken, token } = useLocalStorage(
    "google-one-tap-token"
  );
  const profile = React.useMemo(() => decodeJWT(token), [token]);

  const { reauthenticate, signOut } = useGoogleAPI({
    clearToken,
    options,
    setToken,
    token,
  });

  useSignOutWhenTokenExpires({ profile, signOut });
  useReauthenticateBeforeTokenExpires({ options, profile, reauthenticate });

  const context: React.ContextType<typeof OneTapContext> = {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    isSignedIn: Boolean(token),
    profile,
    signOut,
    token,
  };

  return React.createElement(
    OneTapContext.Provider,
    { value: context },
    typeof children === "function" || children instanceof Function
      ? children(context)
      : children
  );
}

function useSignOutWhenTokenExpires({
  profile,
  signOut,
}: {
  profile?: Profile;
  signOut: () => void;
}) {
  React.useEffect(() => {
    if (!profile) return;

    const expiresIn = profile.exp * 1000 - Date.now();
    if (expiresIn < 0) return;

    const timeout = setTimeout(signOut, expiresIn);
    return () => clearTimeout(timeout);
  }, [profile?.exp]);
}

function useReauthenticateBeforeTokenExpires({
  options,
  profile,
  reauthenticate,
}: {
  options: OneTapOptions;
  profile?: Profile;
  reauthenticate: () => void;
}) {
  React.useEffect(() => {
    if (!profile) return;

    const leadTime = duration(options.reauthenticate ?? defaultReauthenticate);
    if (!leadTime) return;

    const expiresIn = profile.exp * 1000 - Date.now();
    const promptIn = expiresIn - duration(leadTime);
    if (promptIn < 0) return;

    const timeout = setTimeout(reauthenticate, promptIn);
    return () => clearTimeout(timeout);
  }, [profile?.exp]);
}

function duration(value: number | string) {
  if (typeof value === "number") return Math.max(value, 0);
  if (typeof value !== "string") throw new Error(`Invalid value: ${value}`);

  const match =
    /^(\d+)\s*(seconds?|secs?|s|minutes?|mins?|m|milliseconds?|ms)?$/i.exec(
      value
    );
  if (!match) return 0;

  const number = Math.max(parseFloat(match[1]), 0);
  const type = match[2];
  if (!type) return number;

  return /^m|milliseconds?$/i.test(type)
    ? number
    : /minutes?|mins?|m$/i.test(type)
    ? number * 60 * 1000
    : number * 1000;
}
