export type Profile = {
  aud: string;
  email: string;
  email_verified: boolean;
  exp: number;
  family_name: string;
  given_name: string;
  hd?: string;
  iat: number;
  iss: "https://accounts.google.com";
  jti: string;
  name: string;
  nbf: number;
  picture?: string;
  sub: string;
};

declare global {
  const google: {
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
}
