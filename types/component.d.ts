import { Profile } from "./google";

export type OneTapOptions = {
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

export type OneTapContext = {
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
