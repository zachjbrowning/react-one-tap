## Sign in/Sign out

```jsx
const buttonId = 'one-tap-button-id';

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
)

```

## Pass token to server

With SWR:

```javascript
const { signOut, token } = useGoogleOneTap();
const { data, error } = useSWR(token ? "/api" : null, async (path) => {
  const response = await fetch(path, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (response.ok) return await response.json();
  if (response.status === 403) signOut();
  const { error } = await response.json();
  throw new Error(error);
});
```

Or using `SWRConfig`:

```jsx
const { signOut, token } = useGoogleOneTap();

const fetcher = useCallback(
  async (url) => {
    if (!token) return null;
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (response.ok) return await response.json();
    if (response.status === 403) signOut();
    const { error } = await response.json();
    throw new Error(error);
  },
  [token]
);

return <SWRConfig value={{ fetcher }}>{children}</SWRConfig>;
```
