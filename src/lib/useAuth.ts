import { useState, useEffect, useRef } from "react";
import { getStoredGoogleUser, onAuthChange, type GoogleProfile } from "./googleAuth";
import { notifyLogin, currentAccount, recordSharedLogin } from "./notes";
import { fetchUserRecord } from "./userRecords";

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
  const prevSignedIn = useRef(state.signedIn);

  const sync = () => {
    const next = readAuth();
    // Fire login notification on sign-in transition
    if (!prevSignedIn.current && next.signedIn) {
      const { account, name } = currentAccount();
      void notifyLogin(account, name);
      void recordSharedLogin(account, name, localStorage.getItem("indy_auth_provider") ?? "email");
      // Warm the admin-managed record so balance/cards/KYC from the admin
      // console show up without a reload.
      void fetchUserRecord(account).then(() => window.dispatchEvent(new Event("indy-orders")));
    }
    prevSignedIn.current = next.signedIn;
    setState(next);
  };

  const refreshRecord = () => {
    const profile = getStoredGoogleUser();
    if (!profile) return;
    void fetchUserRecord(currentAccount().account).then(() => window.dispatchEvent(new Event("indy-orders")));
  };

  useEffect(() => {
    const eventName = "indy-auth";
    window.addEventListener("storage", sync);
    window.addEventListener(eventName, sync);
    // Admin edits (balance/cards/KYC) push a "record" event over the realtime
    // stream; re-fetch so the change shows with no reload.
    window.addEventListener("indy-record", refreshRecord);
    const unsubscribe = onAuthChange(() => sync());
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(eventName, sync);
      window.removeEventListener("indy-record", refreshRecord);
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}

/** Imperative helper for click handlers that need a synchronous truthy check. */
export function isSignedIn(): boolean {
  return getStoredGoogleUser() !== null;
}