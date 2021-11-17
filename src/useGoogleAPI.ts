import * as React from "react";
import type { OneTapOptions } from ".";
import decodeJWT from "./decodeJWT";

// https://developers.google.com/identity/gsi/web/reference/js-reference
export default function useGoogleAPI({
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
  reauthenticate: () => void;
  signOut: () => void;
} {
  if (!options?.clientId) throw new Error("Missing clientId");
  const automatic = options.automatic ?? true;

  const withScript = useWithScript();

  withScript(function initializeAPI() {
    google.accounts.id.initialize({
      auto_select: automatic,
      callback: ({ credential }) => setToken(credential),
      client_id: options.clientId,
      context: options.context,
    });
  });

  React.useEffect(
    () =>
      withScript(() => {
        if (token) google.accounts.id.cancel();
        else if (automatic) promptToSignIn(options);
        else renderSignInButton(options);
      }),
    [token]
  );

  const reauthenticate = React.useCallback(
    () =>
      withScript(() => {
        google.accounts.id.prompt();
      }),
    [token]
  );

  const signOut = React.useCallback(
    () =>
      withScript(() => {
        if (!token) return;

        clearToken();

        const profile = decodeJWT(token);
        if (profile) google.accounts.id.revoke(profile.sub);
        google.accounts.id.disableAutoSelect();
      }),
    [token]
  );

  return { reauthenticate, signOut };
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
