/**
 * Backend base URL resolution.
 *
 * Indy runs the frontend + API in ONE process (server.js), so on the deployed
 * host the API is same-origin. The trap: the admin console and a client's
 * device can be opened from DIFFERENT hosts. A preview/dev host proxies
 * `/api` to a local `127.0.0.1` server that is NOT the shared store — so an
 * admin edit lands only in that browser's local mirror and the client in
 * another country never sees the new balance.
 *
 * To make shared state (per-client records, chat, logins, scans) work with no
 * manual setup, requests try the same-origin API first and automatically fall
 * back to the deployed backend when it is unreachable. Nobody has to change
 * their environment or do anything "on their end".
 *
 *   • VITE_API_BASE  explicit override, wins over everything
 *   • same-origin /api
 *   • the deployed backend /api (skipped when already on that host)
 *
 * Note: deposit addresses live in src/lib/wallet.ts — not here.
 */
const envBase = (import.meta.env?.VITE_API_BASE as string | undefined)?.replace(/\/$/, '');

/** The deployed backend that serves the shared store for every device. */
export const DEPLOYED_ORIGIN = 'https://indy-cmmi.onrender.com';

export const API_BASE = envBase || '/api';

/** Ordered API bases to try, most-local first. */
export function apiBases(): string[] {
  if (envBase) return [envBase];
  const bases = [API_BASE];
  let sameAsDeployed = false;
  try {
    sameAsDeployed = window.location.origin === DEPLOYED_ORIGIN;
  } catch { /* non-browser */ }
  if (!sameAsDeployed) bases.push(`${DEPLOYED_ORIGIN}/api`);
  return bases;
}

/** Full URL for a `/api/...` path against one base. */
export function apiUrl(path: string, base: string = apiBases()[0]): string {
  return path.startsWith('/api/') ? `${base}${path.slice(4)}` : path;
}

/**
 * fetch() for shared-backend calls: tries each candidate base in order and
 * returns the first successful JSON response. Throws only when every base
 * failed, so callers keep their existing try/catch behaviour.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<unknown> {
  let lastError: unknown = null;
  for (const base of apiBases()) {
    try {
      const res = await fetch(apiUrl(path, base), {
        ...init,
        headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      return await res.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('API unreachable');
}
