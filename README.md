## Install/Usage

```bash
yarn add @assaf/react-one-tap
node install @assaf/react-one-tap
```

## Sign in/Sign out

```jsx
import { GoogleOneTap } from "@assaf/react-one-tap";

function LoginRequired({ children }) {
  const buttonId = "google-sign-in-one-tap";

  return (
    <GoogleOneTap
      autoSelect={true}
      clientId={process.env.GOOGLE_CLIENT_ID}
      context="use"
      fallback={{ buttonId }}
      >
      {({ isSignedIn, profile, signOut }) => isSignedIn ? (
        <main className="regular-page">
          <header>
            Welcome back {profile.name}
            <button onClick={signOut}>sign out</button>
          </header>
          {children}
        </main>
      ) : (
        <main className="sign-in-page">
          <div id={buttonId /}>
        </main>
      )}
    </GoogleOneTap>
  );
}
```

If the user is authenticated, then `isSignIn` is true, and you get their Google profile (`profile`), and JWT access token (`token`).

The profile will include their full name, email address, profile picture, and more fields. See [Profile](src/browser/Profile).

You are responsible to display a button that allows the user to sign out.  That will sign them out of all open tabs and windows. It will also revoke the access token. It will not sign them out from other browsers/devices.

On Safari and iOS, if the user has not signed in before, the UI should show them a sign in button. This is done by creating a container element with a known ID, and setting the `fallback` option.

Chrome, Firefox, and Edge (except on iOS) will show the one-tap UX.


## Pass token to server

With SWR:

```javascript
import { useGoogleOneTap } from "@assaf/react-one-tap";

function MyComponent() {
  const { headers, signOut } = useGoogleOneTap();

  const { data, error } = useSWR(token ? "/api" : null, async (path) => {
    const response = await fetch(path, { headers });
    if (response.ok) return await response.json();
    if (response.status === 403) signOut();
    const { error } = await response.json();
    throw new Error(error);
  });
  ...
}
```

Or using `SWRConfig`:

```jsx
import { useGoogleOneTap } from "@assaf/react-one-tap";

function DefaultFetcher({ children }) {
  const { headers, signOut } = useGoogleOneTap();

  const fetcher = useCallback(
    async (url) => {
      if (!token) return null;
      const response = await fetch(url, { headers });
      if (response.ok) return await response.json();
      if (response.status === 403) signOut();
      const { error } = await response.json();
      throw new Error(error);
    },
    [token]
  );

  return <SWRConfig value={{ fetcher }}>{children}</SWRConfig>;
}
```

`useGoogleOneTap` returns the JWT access token (`token`) and for convenience the authorization header to send to the server (`headers`).


## Authenticate on The Server

Install the Google authentication library:

```
yarn add google-auth-library
npm install google-auth-library
```

Create an authorization handler, depends on your server-side framework:

```javascript
import { authenticate } from "@assaf/react-one-tap/dist/server";

const clientId = process.env.GOOGLE_CLIENT_ID;
const users = ['hi@example.com'];

function authorize(handler) {
  return async function (req, res) {
    const { status, profile, message } = await authenticate({ clientId, req });
    if (!profile) return res.status(status).send(message);

    const isAuthorized = profile.email_verified && users.includes(profile.email);
    if (isAuthorized) handler(req, res);
    else res.status(403).send("Access denied");
  }
};

router.get('/customers', authorize(getCustomers));
```

The `authenticate` looks for a bearer token in the `Authorization` header, verifies its authenticity, and extracts the user profile form it.

It returns three properies:

- `status` is one of 200, 401, or 403
- `profile` is the user profile if authenticated successfully
- `message` is an error message (401/403)

You have access to the user's full name, email address, and whether that address was verified or not (see [Profile](src/browser/Profile.ts)).  In addition, if the user account is managed by G Suite, then `profile.hd` will indicate that.

For persistence, use `profile.sub` which is a unique and immutable user identifier. This allows the user to change their email address, and still sign into their account. Good practice is to save their new email address each time they're authenticated, andalso consider the `email_verified` field.
