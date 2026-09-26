/**
 * Backend base URL — same idea as ShieldSafeBank's src/lib/config.ts, but Indy
 * runs frontend + API in ONE process (server.js), so the API is always
 * same-origin. No second service, no CORS, no hardcoded hostname.
 *
 *   • localhost / dev  → '/api', proxied by vite.config.ts to the local server
 *   • deployed         → same origin '/api' (server.js serves ./dist + /api)
 *   • override         → set VITE_API_BASE at build time (wins over both)
 *
 * Note: deposit addresses live in src/lib/wallet.ts — not here.
 */
const envBase = (import.meta.env?.VITE_API_BASE as string | undefined)?.replace(/\/$/, '');
export const API_BASE = envBase || '/api';
