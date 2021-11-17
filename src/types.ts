export declare type OneTapOptions = {
  // If true (default), automatically signs in user when they visit the page for
  // the first time (supported browsers only), or return to the page after their
  // token expired.
  //
  // If false, then you need to specify `fallback.buttonId`, for a button the
  // user can click to sign in.
  automatic?: boolean;

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

  // Ask user to re-authenticate before their session is about to expire.
  //
  // Can be expressed as number (milliseconds) or string (eg "5m", "30s").
  // Default to "5m", so user prompted to re-authenticate 5 minutes before their
  // session is about to expire.
  //
  // Set to zero to disable.
  reauthenticate?: number | string;
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
  token: string | null;
};

export declare type Profile = {
  // User's email address.
  email: string;
  // True if user's email address was verified
  email_verified: boolean;
  // Issuer of the JWT token
  iss: "https://accounts.google.com";
  // User's profile picture.
  picture: string;
  // Unique immutable identifier of the user.
  sub: string;
  // User's given name
  given_name: string;
  // User's family name
  family_name: string;
  // User's full name
  name: string;
  // The audience for this token: same as client ID
  aud: string;
  // Timestamp when token was issued (Unix time, seconds)
  iat: number;
  // Timestamp when this token expires (Unix time, seconds)
  exp: number;
  // The hosted G Suite domain of the user. Available when user belongs to a hosted domain.
  hd?: string;
};
