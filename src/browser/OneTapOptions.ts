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
