import { useState, useEffect } from "react";
import { getStoredGoogleUser, onAuthChange, type GoogleProfile } from "./googleAuth";

// Shared auth state for UI gating (wallet connect, support chat).
//
// Reads the stored profile synchronously so components can render the right
// surface on first paint, and subscribes to auth changes so the UI updates
// when a Supabase session appears or disappears.

export interface AuthState {
  signedIn: boolean;
  profile: GoogleProfile | null;
}

function readAuth(): AuthState {
  const profile = getStoredGoogleUser();
  return { signedIn: profile !== null, profile };
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(readAuth);
  const sync = () => setState(readAuth());

  useEffect(() => {
    const eventName = "indy-auth";
    window.addEventListener("storage", sync);
    window.addEventListener(eventName, sync);
    const unsubscribe = onAuthChange(() => sync());
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(eventName, sync);
      unsubscribe();
    };
  }, []);

  return state;
}

/** Imperative helper for click handlers that need a synchronous truthy check. */
export function isSignedIn(): boolean {
  return getStoredGoogleUser() !== null;
}