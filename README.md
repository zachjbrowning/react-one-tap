React components for [one-tap sign-in](https://developers.google.com/identity/one-tap/) with your Google account.


## Why?

[One-Tap](https://developers.google.com/identity/gsi/web/guides/overview) is a super simple UI for signing with your Google account.

In supported browsers, one-tap is a slick user experience. It pops an overlay at the top/right of the page, with your active Google account. It takes a single click to sign in.

(And it supports having multiple Google accounts and let you switch between them)

When you return to the app after your token has expired (~1 hour), it will automatically sign you in again with a new token. There's a short delay which allows you to cancel.

You're not going to be bouncing around through multiple pages, the jerky OAuth flow you get with "Sign in with X" buttons.

So this is the quickest and easiest way I found to add single sign-on.


## No Free Launches

There are tradeoffs of course.

The user experience is great in supported browsers. That means Chrome, Firefox, and Edge (not Safari). On every operating system except for iOS and iPadOS, because those only have one browser (all other browsers are re-skinned Safari).

The user experience on unsupported browsers is not bad, it's just no better than OAuth.

This only works for users that have a Google account. However, you don't need a GMail or G Suite account. And many people have Google accounts, they use them for YouTube, Google Docs, Android, etc.

This UI doesn't blend well with other methods of authentication. So if you want to give users multiple options — email/password, magic link, Facebook, GitHub, etc — you should be using OAuth instead.

It should go without saying you're helping Google track users across the web. Because cookies are going away, the next best thing is to try and get everyone to sign in with their Google account.


## Regardless …

I'm using this for "internal" apps. I know every user has a Google account, so not going to bother with other methods of authentication.

And we're using other Google products, so already signed into the account, so this is the easiest SSO experience.

If you trust Google to authenticate users, then it's a pretty good authentication mechanism. On the back-end verify users by checking email address, or email domain.


## Install

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

If the user is authenticated, then `isSignIn` is true. You also get the JWT access token (`token`) and their Google profile (`profile`).

The profile will include their name, email address, picture, etc. See [Profile](src/browser/Profile).

To allow users to sign out, you need to render a button that will call `signOut`. It will sign them out of all open tabs, and revoke their access token. It will not sign them out of other browsers/devices.

On Safari and iOS, if the user has not signed in before, then the one-tap overlay doesn't show. If you want these users to sign in, you need to use the `fallback` option.

That option expects the ID of a container element. It will render a sign-in button into that element.


## Pass JWT Token to Server

With [SWR](https://swr.vercel.app) you can do somethig like this:

```typescript
import { useGoogleOneTap } from "@assaf/react-one-tap";

function MyComponent() {
  const { headers, signOut } = useGoogleOneTap();

  const { data, error } = useSWR(
    token ? "/api" : null,
    async (path) => {
      const response = await fetch(path, { headers });
      if (response.ok) {
        return await response.json();
      } else {
        if (response.status === 403) signOut();
        const { error } = await response.json();
        throw new Error(error);
      }
    });
  ...
}
```

Or using `SWRConfig`:

```tsx
import { useGoogleOneTap } from "@assaf/react-one-tap";

function WithFetcher({ children }) {
  const { headers, signOut } = useGoogleOneTap();

  async function fetcher(url) {
    if (!token) return null;

    const response = await fetch(url, { headers });
    if (response.ok) {
      return await response.json();
    } else {
      if (response.status === 403) signOut();
      const { error } = await response.json();
      throw new Error(error);
    }
  };

  return <SWRConfig value={{ fetcher }}>{children}</SWRConfig>;
}
```

`useGoogleOneTap` returns the JWT access token (`token`) and for convenience the authorization header to send to the server (`headers`).


## Authenticate on The Server

You'll need the Google authentication library (peer dependency):

```
yarn add google-auth-library
npm install google-auth-library
```

Create an authorization handler, varies by the server-side framework you use:

```typescript
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

The `authenticate` function looks for an `Authorization` header with a bearer token in it. It verifies the token, this will reject revoked tokens (if the user signed out).

It returns three properties:

- `status` is one of 200, 401, or 403
- `profile` is the user's profile, if authenticated succesfully
- `message` is an error message to go along with 401/403 status code

From the profile, you have access to the user's name, email address, and whether that address was verified. See [Profile](src/browser/Profile.ts).

You can check if the account is a G Suite account by looking at `profile.hd`, and authenticate based on the domain (ie `email: "me@example.com", hd: "example.com"` ).

If you're storing state, use `profile.sub`, which is the unique and immutable user identifier.

This allows users to change their email address. If you're using their email address from the profile, you may want to save is every so often.  And also consider the `email_verified` field.
