// Google Sign-In helper.
//
// Two modes, picked automatically:
//  1. Supabase Google OAuth — used when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
//     are set. Supabase holds the client secret server-side; the browser never
//     sees it.
//  2. Google Identity Services (GIS) popup — fallback while no Supabase project
//     is configured yet. Uses the public client ID only, no secret.
//
// Uses VITE_GOOGLE_CLIENT_ID (public). The Client Secret must NEVER go in
// frontend code or git — it lives server-side only (Supabase Auth >
// Providers > Google, or your backend env).

import {
  isSupabaseConfigured,
  signInWithGoogleOAuth,
  getSupabaseProfile,
  onSupabaseAuthChange,
} from "./supabase";

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

const GSI_SCRIPT = "https://accounts.google.com/gsi/client";

let scriptPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (typeof window !== "undefined" && (window as unknown as { google?: unknown }).google) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = GSI_SCRIPT;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

function decodeCredential(credential: string): GoogleProfile {
  // ID token is base64url JSON — decode payload without extra deps.
  const payload = credential.split(".")[1] ?? "";
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json) as GoogleProfile;
}

export function getGoogleClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID as string ?? "";
}

export async function signInWithGooglePopup(): Promise<GoogleProfile> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error(
      "Missing VITE_GOOGLE_CLIENT_ID. Copy .env.example to .env and set VITE_GOOGLE_CLIENT_ID, then restart the dev server."
    );
  }
  await loadGsiScript();
  const google = (window as unknown as {
    google: { accounts: { oauth2: {
      initTokenClient: (cfg: Record<string, unknown>) => { requestAccessToken: () => void };
    } } };
  }).google;

  // Use GIS token client (implicit flow) to get the user's profile via
  // userinfo endpoint — no client secret needed on the frontend.
  const accessToken: string = await new Promise((resolve, reject) => {
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "openid email profile",
        callback: (resp: { access_token?: string; error?: string }) => {
          if (resp?.access_token) resolve(resp.access_token);
          else reject(new Error(resp?.error || "Google sign-in was cancelled."));
        },
      });
      client.requestAccessToken();
    } catch (e) {
      reject(e);
    }
  });

  const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error("Could not fetch Google profile.");
  const info = (await r.json()) as GoogleProfile;

  // Persist the session so the UI can greet the user.
  rememberProfile(info);
  return info;
}

export async function signInWithGoogleCredential(): Promise<GoogleProfile> {
  // Fallback: One-Tap / GIS credential (ID token) flow.
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("Missing VITE_GOOGLE_CLIENT_ID. Set it in .env (see .env.example).");
  }
  await loadGsiScript();
  const google = (window as unknown as {
    google: { accounts: { id: {
      initialize: (cfg: Record<string, unknown>) => void;
      prompt: () => void;
    } } };
  }).google;

  return new Promise((resolve, reject) => {
    try {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp: { credential?: string }) => {
          try {
            if (!resp?.credential) throw new Error("Google sign-in was cancelled.");
            const profile = decodeCredential(resp.credential);
            rememberProfile(profile);
            resolve(profile);
          } catch (e) {
            reject(e);
          }
        },
      });
      google.accounts.id.prompt();
    } catch (e) {
      reject(e);
    }
  });
}

/** Saves the signed-in profile locally so the UI can greet the user. */
export function rememberProfile(profile: GoogleProfile): void {
  localStorage.setItem("indy_google_user", JSON.stringify(profile));
  localStorage.setItem("indy_auth_provider", isSupabaseConfigured ? "supabase-google" : "google");
  localStorage.setItem("indy_user_email", profile.email);
  localStorage.setItem("indy_user_name", profile.name);
}

/**
 * Starts Google sign-in against whichever backend is configured.
 *
 * Returns the profile for the GIS popup flow, or `null` when the browser is
 * being redirected to Google (Supabase OAuth) — in that case the page is about
 * to navigate away and the caller should not do anything else.
 */
export async function startGoogleSignIn(redirectPath = "/dashboard"): Promise<GoogleProfile | null> {
  if (isSupabaseConfigured) {
    await signInWithGoogleOAuth(redirectPath);
    return null;
  }
  const profile = await signInWithGooglePopup();
  rememberProfile(profile);
  return profile;
}

/**
 * Profile of an already signed-in user. With Supabase this also completes the
 * OAuth hand-off when the browser comes back from Google with a `?code=`.
 */
export async function getActiveProfile(): Promise<GoogleProfile | null> {
  if (isSupabaseConfigured) {
    const profile = await getSupabaseProfile();
    if (profile) rememberProfile(profile);
    return profile;
  }
  return getStoredGoogleUser();
}

/** Fires when a Supabase session appears or disappears. No-op without Supabase. */
export function onAuthChange(cb: (profile: GoogleProfile | null) => void): () => void {
  return onSupabaseAuthChange(profile => {
    if (profile) rememberProfile(profile);
    cb(profile);
  });
}

export function getStoredGoogleUser(): GoogleProfile | null {
  try {
    const raw = localStorage.getItem("indy_google_user");
    return raw ? (JSON.parse(raw) as GoogleProfile) : null;
  } catch {
    return null;
  }
}
