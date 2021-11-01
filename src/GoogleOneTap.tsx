import React from "react";
import type { OneTapContext, OneTapOptions } from "../types/component";
import type { Profile } from "../types/google";

export const GoogleOneTapContext = React.createContext<OneTapContext>({
  isSignedIn: false,
  signOut: () => undefined,
  token: null,
});

export default function GoogleOneTap({
  children,
  ...options
}: {
  children: React.ReactNode | ((context: OneTapContext) => React.ReactNode);
} & OneTapOptions) {
  const { profile, clearToken, setToken, token } = useLocalStorage(
    "google-one-tap-token"
  );
  const { signOut } = useGoogleAPI({
    clearToken,
    options,
    setToken,
    token,
  });

  const context: OneTapContext = {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    isSignedIn: Boolean(token),
    profile,
    signOut,
    token,
  };

  return (
    <GoogleOneTapContext.Provider value={context}>
      {typeof children === "function" || children instanceof Function
        ? children(context)
        : children}
    </GoogleOneTapContext.Provider>
  );
}

// We use local storage, so user doesn't have to sign in again when they refresh
// the page, or open a new tab.  And when the user signs out, they are signed
// out of all open tabs.
function useLocalStorage(keyName: string): {
  clearToken: () => void;
  profile?: Profile;
  setToken: (token: string | null) => void;
  token: string | null;
} {
  const [unverifiedToken, setToken] = React.useState(() =>
    typeof localStorage !== "undefined" ? localStorage.getItem(keyName) : null
  );
  const { profile, token } = verify(unverifiedToken);

  const eventName = `change:${keyName}`;

  React.useEffect(function () {
    window.addEventListener(eventName, onOneTapChanged);
    return () => window.removeEventListener(eventName, onOneTapChanged);

    function onOneTapChanged(event: Event) {
      setToken((event as CustomEvent).detail);
    }
  }, []);

  React.useEffect(function watchOtherTabs() {
    window.addEventListener("storage", onStorageEvent);
    return () => window.removeEventListener("storage", onStorageEvent);

    function onStorageEvent(event: StorageEvent) {
      if (event.key === keyName) setToken(event.newValue);
    }
  }, []);

  React.useEffect(
    function persistToken() {
      if (token) window.localStorage.setItem(keyName, token);
      else window.localStorage.removeItem(keyName);
      window.dispatchEvent(new CustomEvent(eventName, { detail: token }));
    },
    [token]
  );

  return {
    profile,
    token,
    setToken,
    clearToken: () => setToken(null),
  };
}

function verify(token: string | null): {
  token: string | null;
  profile?: Profile;
} {
  if (!token) return { token };
  try {
    const profile = decodeJWT(token);
    const { exp } = profile;
    const isExpired = exp * 1000 < Date.now();
    return isExpired ? { token: null } : { profile, token };
  } catch (error) {
    return { token: null };
  }
}

// https://developers.google.com/identity/gsi/web/reference/js-reference
function useGoogleAPI({
  clearToken,
  options,
  setToken,
  token,
}: {
  clearToken: () => void;
  options: OneTapOptions;
  setToken: (token: string | null) => void;
  token: string | null;
}): {
  signOut: () => void;
} {
  if (!options?.clientId) throw new Error("Missing clientId");
  const withScript = useWithScript();

  withScript(function initializeAPI() {
    google.accounts.id.initialize({
      auto_select: options.autoSelect,
      callback: ({ credential }) => setToken(credential),
      client_id: options.clientId,
      context: options.context,
    });
  });

  React.useEffect(
    () =>
      withScript(() => {
        if (token) google.accounts.id.cancel();
        else promptToSignIn(options);
      }),
    [token]
  );

  const signOut = React.useCallback(
    () =>
      withScript(() => {
        if (!token) return;

        clearToken();
        const { sub } = decodeJWT(token);
        google.accounts.id.revoke(sub);
        google.accounts.id.disableAutoSelect();
      }),
    [token]
  );

  return { signOut };
}

function promptToSignIn(options: OneTapOptions) {
  google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed()) renderSignInButton(options);
  });
}

function renderSignInButton(options: OneTapOptions) {
  const { fallback } = options;
  if (fallback) {
    const container = document.getElementById(fallback.buttonId);
    if (container) google.accounts.id.renderButton(container, fallback);
  }
}

function useWithScript(): (callbackfn: () => unknown) => void {
  const [queue] = React.useState<Array<(script: HTMLScriptElement) => void>>(
    []
  );

  React.useEffect(function () {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.addEventListener("load", onLoad);
    document.head.appendChild(script);

    return function () {
      script.removeEventListener("load", onLoad);
      queue.length = 0;
    };

    function onLoad() {
      queue.forEach((callbackfn) => callbackfn(script));
      queue.length = 0;
    }
  }, []);

  return function (callbackfn) {
    const isScriptLoaded =
      typeof google !== "undefined" && google.accounts?.id?.initialize;
    if (isScriptLoaded) callbackfn();
    else queue.push(callbackfn);
  };
}

function decodeJWT(token: string): Profile {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(json);
}
