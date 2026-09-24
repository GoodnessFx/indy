// Supabase client for the browser.
//
// Reads the two PUBLIC values from Render -> Environment (or .env locally):
//   VITE_SUPABASE_URL        https://<project-ref>.supabase.co
//   VITE_SUPABASE_ANON_KEY   the "anon public" / publishable key
//
// These are public by design (they ship in the JS bundle and are protected by
// Row Level Security). The Postgres connection string and the database password
// from Supabase's "Connect" dialog are SERVER-side secrets — never put them
// here, never in a VITE_* variable, never in git.

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import type { GoogleProfile } from "./googleAuth";

const url = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "").trim();
const anonKey = ((import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "").trim();

const looksLikePlaceholder = /YOUR-PROJECT|your-anon-key/i.test(url + anonKey);

export const isSupabaseConfigured =
  /^https:\/\/.+\.supabase\.(co|in)$/.test(url) && anonKey.length > 20 && !looksLikePlaceholder;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })
  : null;

function splitName(fullName: string): { given_name?: string; family_name?: string } {
  const [first, ...rest] = fullName.trim().split(/\s+/);
  if (!first) return {};
  return { given_name: first, family_name: rest.join(" ") || undefined };
}

export function profileFromSession(session: Session): GoogleProfile {
  const meta = (session.user.user_metadata ?? {}) as Record<string, string | undefined>;
  const name = meta.full_name ?? meta.name ?? session.user.email ?? "Investor";
  return {
    sub: session.user.id,
    email: session.user.email ?? "",
    name,
    picture: meta.avatar_url ?? meta.picture,
    ...splitName(name),
  };
}

/** Starts the Supabase Google OAuth flow. Redirects the whole page to Google. */
export async function signInWithGoogleOAuth(redirectPath = "/dashboard"): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${redirectPath}`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw new Error(error.message);
  return true;
}

/** Current session, if the user already signed in (also handles OAuth return). */
export async function getSupabaseProfile(): Promise<GoogleProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return profileFromSession(data.session);
}

/** Subscribe to sign-in / sign-out. Returns an unsubscribe function. */
export function onSupabaseAuthChange(cb: (profile: GoogleProfile | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(session ? profileFromSession(session) : null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
  localStorage.removeItem("indy_google_user");
  localStorage.removeItem("indy_auth_provider");
  localStorage.removeItem("indy_user_email");
  localStorage.removeItem("indy_user_name");
}
