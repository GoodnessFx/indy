import { useState, useEffect, useRef } from "react";
import { getStoredGoogleUser, onAuthChange, type GoogleProfile } from "./googleAuth";
import { notifyLogin, currentAccount, recordSharedLogin } from "./notes";
import { fetchUserRecord } from "./userRecords";

// Shared auth state for UI gating (wallet connect, support chat).
//
// Reads the stored profile synchronously so components can render the right
// surface on first paint, and subscribes to auth changes so the UI updates
// when a Supabase session appears or disappears.
//
// REMOTE-DEVICE BALANCE SYNC (why this file matters to the $150k question):
// The Dashboard balance comes from `user_records` on the SHARED backend
// (server.js Postgres when DATABASE_URL is set, else server/data/store.json),
// keyed by the client's account email. This hook warms that record from the
// backend at sign-in so one device picking up its record cannot be confused
// with data written locally on another device.

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
      // console show up without a reload. The client renders the record from
      // its local mirror only after this fetch overwrites it on THIS device,
      // so a remote device never displays the admin's machine-local edits.
      void fetchUserRecord(account).then(() => window.dispatchEvent(new Event("indy-orders")));
    }
    prevSignedIn.current = next.signedIn;
    setState(next);
  };

  const refreshRecord = () => {
    const profile = getStoredGoogleUser();
    if (!profile) return;
    const account = currentAccount().account;
    void fetchUserRecord(account).then(() => window.dispatchEvent(new Event("indy-orders")));
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