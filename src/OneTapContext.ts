import * as React from "react";
import { OneTapContext } from "../types";

export default React.createContext<OneTapContext>({
  isSignedIn: false,
  signOut: () => undefined,
  token: null,
});
