import React from "react";
import { Profile } from "./Profile";

export declare type OneTapOptions = {
  // If true, automatically signs in user when they return to the page.
  //
  // Only applies if the user has signed in before, and their token expired.
  //
  // User can still cancel.
  //
  // If false, then after the session expires, the user will be prompted to sign
  // in again.
  autoSelect?: boolean;

  // The OAuth client ID for your web application.  Required.
  clientId: string;

  // Whether user it promoted to "Sign in with Google", "Use with Google", etc.
  context?: "signin" | "signup" | "use";

  // The fallback for one-tap is the Sign In with Google button.
  //
  // This is only if you want to use the Sign In button as fallback when one-tap
  // is not available, eg Safari and iOS.
  //
  // You need to set fallback.buttonId, and render an empty element with the same ID.
  fallback?: {
    // This is the ID of the element that will contain the button.  This element
    // needs to be in the DOM.
    buttonId: string;
    size?: "small" | "medium" | "large";
  };
};

export declare type OneTapContext = {
  // Bearer token authorization header for the API call:
  //
  // Authorization: Bearer <token>
  headers?: { authorization: string };

  isSignedIn: boolean;

  // JTW token payload provides user name, email address, photo, etc.
  profile?: Profile;

  // Call this function to sign-out the user from this and all other tabs.
  //
  // You can also call this if the server responds with 403 (access token revoked).
  signOut: () => void;

  // This is the OAuth Bearer token.
  token?: string | null;
};

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

declare const google: {
  accounts: {
    id: {
      cancel: () => void;
      disableAutoSelect: () => void;
      initialize: ({
        auto_select,
        callback,
        cancel_on_tap_outside,
        client_id,
        context,
      }: {
        auto_select?: boolean;
        callback?: ({
          clientId,
          credential,
          select_by,
        }: {
          clientId: string;
          credential: string;
          select_by: "auto";
        }) => void;
        cancel_on_tap_outside?: boolean;
        client_id: string;
        context?: "signin" | "signup" | "use";
      }) => void;
      prompt: (
        callback?: (notification: {
          isNotDisplayed: () => boolean;
          isSkippedMoment: () => boolean;
        }) => void
      ) => void;
      renderButton: (
        element: HTMLElement,
        options: {
          size?: "small" | "medium" | "large";
        }
      ) => void;
      revoke: (identity: string, callback?: () => void) => void;
      setLogLevel: (level: "info" | "warn" | "error") => void;
    };
  };
};