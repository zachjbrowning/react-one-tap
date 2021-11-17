import * as React from "react";
import type { OneTapContext } from ".";

export default React.createContext<OneTapContext>({
  isSignedIn: false,
  signOut: () => undefined,
  token: null,
});
