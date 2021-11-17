import * as React from "react";
import type { OneTapContext } from ".";

const Context = React.createContext<OneTapContext>({
  isSignedIn: false,
  signOut: () => undefined,
  token: null,
});
const { Provider, Consumer } = Context;

export default Context;
export { Consumer as OneTapContextConsumer, Provider as OneTapContextProvider };
