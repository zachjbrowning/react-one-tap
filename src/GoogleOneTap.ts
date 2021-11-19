import * as React from "react";
import { OneTapContext, OneTapOptions, Profile } from ".";
import decodeJWT from "./decodeJWT";
import { OneTapContextProvider } from "./OneTapContext";
import useGoogleAPI from "./useGoogleAPI";
import useLocalStorage from "./useLocalStorage";

// Ask user to re-authenticate 5 mintues before their session is about to
// expire.
const defaultReauthenticate = "5m";

export default function GoogleOneTap({
  children,
  ...options
}: {
  children: React.ReactNode | ((context: OneTapContext) => React.ReactNode);
} & OneTapOptions) {
  const { profile, setToken, token } = useVerifiedToken();

  const { reauthenticate, signOut } = useGoogleAPI({
    options,
    setToken,
    token,
  });

  useSignOutWhenTokenExpires({ profile, signOut });
  useReauthenticateBeforeTokenExpires({ options, profile, reauthenticate });

  const context: OneTapContext = {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    isSignedIn: Boolean(token),
    profile,
    signOut,
    token,
  };

  return React.createElement(
    OneTapContextProvider,
    { value: context },
    typeof children === "function" || children instanceof Function
      ? children(context)
      : children
  );
}

// Return token and profile if token has not expired yet.
function useVerifiedToken(): {
  profile?: Profile;
  setToken: (token: string | null) => void;
  token: string | null;
} {
  const { setToken, token } = useLocalStorage("google-one-tap-token");
  const profile = React.useMemo(() => decodeJWT(token), [token]);
  return {
    profile,
    setToken,
    token: profile ? token : null,
  };
}

// Sign out user the moment their token expires
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
  }, [profile, signOut]);
}

// Re-authenticate user before their token expires
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

    const leadTime = getLeadTime(options);
    if (!leadTime) return;

    const expiresIn = profile.exp * 1000 - Date.now();
    const promptIn = expiresIn - leadTime;
    if (promptIn < 0) return;

    const timeout = setTimeout(reauthenticate, promptIn);
    return () => clearTimeout(timeout);
  }, [profile, options, reauthenticate]);
}

function getLeadTime(options: OneTapOptions): number {
  const leadTime = options.reauthenticate ?? defaultReauthenticate;
  if (leadTime === false) return 0;
  if (typeof leadTime === "number") return Math.max(leadTime, 0);
  if (typeof leadTime !== "string")
    throw new Error(`Invalid value: ${leadTime}`);

  const match =
    /^(\d+)\s*(seconds?|secs?|s|minutes?|mins?|m|milliseconds?|ms)?$/i.exec(
      leadTime
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
