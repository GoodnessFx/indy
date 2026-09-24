# IndySolutions — Deploy notes (Render + Supabase + Google Sign-In)

## 0. Why the last Render deploy failed

The build succeeded, then Render ran `yarn start` and got:

```
error Command "start" not found.
```

`package.json` had no `start` script. Fixed in this repo: `"start": "vite preview"`.
That command is already Render-compatible because `vite.config.ts` binds
`host: 0.0.0.0` and `port: process.env.PORT`.

Rebuild locally to confirm at any time:

```bash
pnpm run build
pnpm start          # serves ./dist on PORT (default 8443)
```

---

## 1. Render settings

### Option A — keep the current **Web Service** (fastest, already wired up)

| Field | Value |
| --- | --- |
| Language / Runtime | Node |
| Branch | `main` |
| Build Command | `pnpm install --frozen-lockfile && pnpm run build` |
| Start Command | `pnpm start` |
| Health Check Path | `/` |
| Auto-Deploy | `Yes` |

`pnpm start` runs `vite preview`, which serves `dist/` with SPA fallback
(`/dashboard`, `/settings`, `/admin`, ... all resolve to `index.html`).

### Option B — **Static Site** (recommended for a Vite SPA: CDN, free, no server)

Create a **new** service of type *Static Site* on the same repo instead of a Web Service:

| Field | Value |
| --- | --- |
| Build Command | `pnpm install --frozen-lockfile && pnpm run build` |
| Publish Directory | `dist` |
| Redirects/Rewrites rule | Source `/*` → Destination `/index.html` → Action **Rewrite** |

The rewrite rule is mandatory: without it, refreshing `/dashboard` returns 404.
No start command is needed for a Static Site.

---

## 2. Render → **Environment** variables

Render Dashboard → your service → **Environment** → *Add Environment Variable*.

| Key | Value | Required |
| --- | --- | --- |
| `VITE_GOOGLE_CLIENT_ID` | `24300395823-u2fjcqaqai5j2dphrhdo0cbjjdisd4vn.apps.googleusercontent.com` | ✅ yes (Google button) |
| `VITE_SUPABASE_URL` | `https://<your-project-ref>.supabase.co` | only if you wire Supabase |
| `VITE_SUPABASE_ANON_KEY` | `<your anon public key>` | only if you wire Supabase |
| `NODE_VERSION` | `22` | optional |

Notes:

- Only `VITE_*` names reach the browser bundle. **Never** create a
  `VITE_GOOGLE_CLIENT_SECRET` — it would be inlined into public JavaScript.
- Vite inlines env vars **at build time**. After adding/editing them you must
  redeploy (Manual Deploy → *Clear build cache & deploy*).

---

## 3. Supabase (Google provider)

Supabase Dashboard → **Authentication → Providers → Google** → enable, then:

| Field | Value |
| --- | --- |
| Client ID | `24300395823-u2fjcqaqai5j2dphrhdo0cbjjdisd4vn.apps.googleusercontent.com` |
| Client Secret | your `GOCSPX-...` secret (server-side value, never in this repo) |
| Skip nonce checks | off (default) |

Copy the **Callback URL (for OAuth)** Supabase shows on that screen — it looks like:

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

That exact URL must be added to Google Cloud Console (step 4).

Supabase API values for the `VITE_SUPABASE_*` vars above:
Dashboard → **Settings → API** → *Project URL* and *anon public* key.

---

## 4. Google Cloud Console (OAuth client)

APIs & Services → **Credentials → OAuth 2.0 Client IDs → your Web client**.

**Authorized JavaScript origins** (required by the Google button in this app):

```
http://localhost:8443
https://<your-service>.onrender.com
```

**Authorized redirect URIs** (required only for the Supabase flow):

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

Missing origins produce `Error 400: origin_mismatch` / "Access blocked" when the
user clicks *Continue with Google*.

---

## 5. Local development

```bash
cp .env.example .env      # then confirm VITE_GOOGLE_CLIENT_ID is set
pnpm install
pnpm dev                  # http://localhost:8443
```

`.env` is gitignored; `.env.example` (no secrets) is committed.

---

## 6. Security

- The Google **client secret is a server-side credential.** It belongs in
  Supabase / your backend / GitHub Actions secrets — never in git, never in a
  `VITE_*` variable, never in a screenshot or chat.
- The client ID is public by design and is safe to commit.
- If the secret was ever pasted somewhere public, rotate it:
  Google Cloud Console → Credentials → your OAuth client → **Reset secret**,
  then update the new value in Supabase → Providers → Google.
