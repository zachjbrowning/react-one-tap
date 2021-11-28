import { GoogleOneTap } from "@assaf/react-one-tap";
import React from "react";
import { SWRConfig } from "swr";

export default function App({ children }) {
  const buttonId = "google-sign-in-one-tap";

  return (
    <GoogleOneTap
      autoSelect={true}
      clientId={process.env.GOOGLE_CLIENT_ID}
      context="use"
      fallback={{ buttonId }}
    >
      {({ isSignedIn, headers, profile, signOut }) =>
        isSignedIn ? (
          <SWRConfig
            value={{
              fetcher: async (url) => {
                if (!headers) return null;

                const response = await fetch(url, { headers });
                if (response.ok) {
                  return await response.json();
                } else {
                  if (response.status === 403) signOut();
                  const { error } = await response.json();
                  throw new Error(error);
                }
              },
            }}
          >
            <main className="regular-page">
              <header>
                Welcome back {profile.name}
                <button onClick={signOut}>sign out</button>
              </header>
              {children}
            </main>
          </SWRConfig>
        ) : (
          <main className="sign-in-page">
            <div id={buttonId} />
          </main>
        )
      }
    </GoogleOneTap>
  );
}
