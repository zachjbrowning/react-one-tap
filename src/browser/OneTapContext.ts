import * as React from "react";
import { Profile } from "./Profile";

declare type OneTapContext = {
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
  token: string | null;
};

export default React.createContext<OneTapContext>({
  isSignedIn: false,
  signOut: () => undefined,
  token: null,
});
