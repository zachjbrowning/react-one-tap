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
