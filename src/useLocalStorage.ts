import * as React from "react";

// We use local storage, so user doesn't have to sign in again when they refresh
// the page, or open a new tab.  And when the user signs out, they are signed
// out of all open tabs.
export default function useLocalStorage(keyName: string): {
  setToken: (token: string | null) => void;
  token: string | null;
} {
  const [token, setToken] = React.useState(() =>
    typeof localStorage !== "undefined" ? localStorage.getItem(keyName) : null
  );

  React.useEffect(
    function watchOtherTabs() {
      window.addEventListener("storage", onStorageEvent);
      return () => window.removeEventListener("storage", onStorageEvent);

      function onStorageEvent(event: StorageEvent) {
        if (event.key === keyName) setToken(event.newValue);
      }
    },
    [keyName]
  );

  React.useEffect(
    function persistToken() {
      if (token) window.localStorage.setItem(keyName, token);
      else window.localStorage.removeItem(keyName);
    },
    [keyName, token]
  );

  return {
    token,
    setToken,
  };
}
