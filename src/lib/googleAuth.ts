// Google Identity Services (GIS) helper — frontend only.
// Uses VITE_GOOGLE_CLIENT_ID (public). The Client Secret must NEVER go in
// frontend code or git — it lives server-side only (e.g. Supabase Auth >
// Providers > Google, or your backend env).

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

  // Persist a minimal session for this front-end-only app (demo auth store).
  localStorage.setItem("indy_google_user", JSON.stringify(info));
  localStorage.setItem("indy_auth_provider", "google");
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
            localStorage.setItem("indy_google_user", JSON.stringify(profile));
            localStorage.setItem("indy_auth_provider", "google");
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

export function getStoredGoogleUser(): GoogleProfile | null {
  try {
    const raw = localStorage.getItem("indy_google_user");
    return raw ? (JSON.parse(raw) as GoogleProfile) : null;
  } catch {
    return null;
  }
}
