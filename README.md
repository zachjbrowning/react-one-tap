## Install/Usage

```
yarn add @assaf/react-one-tap
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
