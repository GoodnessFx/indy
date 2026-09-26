# IndySolutions — Deploy notes (Render + optional Supabase + Google Sign-In)

## 0. How this app is deployed now (ShieldSafeBank pattern)

ONE Render **Web Service** runs everything:

| Field | Value |
| --- | --- |
| Build Command | `npm install && npm run build` (or `pnpm install --frozen-lockfile && pnpm run build`) |
| Start Command | `npm start` → `node server.js` |
| Health Check Path | `/api/health` |

`server.js` serves the built frontend from `./dist` **and** the chat/users API on
the same origin, so `/api/*` always exists — no separate API service and no CORS:

- `GET  /api/chat/all` — every message
- `GET  /api/chat/thread?account=EMAIL` — one thread
- `GET  /api/chat/stream?account=EMAIL` — **SSE realtime push** (empty account = admin, receives all)
- `GET  /api/chat/presence` — `{ adminsOnline }`
- `POST /api/chat/send` — `{ account, name, sender, body }`
- `POST /api/chat/seen?account=EMAIL` — clears the admin unread badge
- `POST /api/chat/login` — login notification
- `POST /api/chat/typing` — typing indicator
- `GET  /api/users/all` — every signup with **full login history**
- `POST /api/users/login` — `{ email, name, method }`

### Chat storage — no SQL Editor steps

Same as ShieldSafeBank: set `DATABASE_URL` and the tables are created
**automatically on boot** (`CREATE TABLE IF NOT EXISTS`). There is nothing to run
by hand, no schema file to paste, no Supabase dashboard step.

| `DATABASE_URL` | Storage | Survives redeploys? |
| --- | --- | --- |
| set (Supabase Postgres URI) | Postgres (`chat_messages`, `chat_users`, `chat_logins`) | ✅ yes |
| unset (local dev) | `server/data/store.json` | ❌ no (fine on localhost) |

On Render: your service → **Environment** → add `DATABASE_URL` =
`postgresql://...` from Supabase → **Connect** (Session pooler). Read in code as
`process.env.DATABASE_URL` — never hardcoded, never in git, never a `VITE_*` var.

> Without `DATABASE_URL` on Render (ephemeral filesystem) chat would reset on
> every restart/deploy. That is the only reason to set it.

---

## 1. Why an earlier deploy failed

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

## 2b. Database (`DATABASE_URL`) — backend only

Read this ONLY if you want chat + login history to survive redeploys.

`server.js` reads `process.env.DATABASE_URL` and **creates its own tables on
boot**. Nothing to run in the Supabase SQL Editor — unlike `schema.sql`
(which is for the wider product tables and *does* need the migration runner).

| Key | Value | Required |
| --- | --- | --- |
| `DATABASE_URL` | your `postgresql://...` Supabase connection string (pooler) | optional — chat works without it on localhost |

Rules:
- Set it as an environment variable on the **backend** service only. Never put it in a
  `VITE_*` variable — Vite inlines `VITE_*` into the public browser bundle at build time.
- Read it from `process.env.DATABASE_URL` in code. Never hardcode it in a file, never
  commit it. It is a server-side secret.
- It is already gitignored via `.env` and should never appear in `.env.example`.

### Optional: the wider product schema
`supabase/schema.sql` creates the `users`, `portfolios`, and `transactions` tables (plus
others). That one is separate from chat and needs the runner (or paste it into SQL Editor):

```bash
npm i --no-save pg                     # install the Postgres client ad hoc
DATABASE_URL="postgresql://..." node supabase/migrate.mjs --check   # confirm connectivity
DATABASE_URL="postgresql://..." node supabase/migrate.mjs           # apply schema.sql
```

Or paste `supabase/schema.sql` into **Supabase Dashboard → SQL Editor** and run it there
(the runner is only needed for a non-interactive / CI / backend context).

---

Supabase Dashboard → **Authentication → Providers → Google** → enable, then:

| Field | Value |
| --- | --- |
| Client ID | `24300395823-u2fjcqaqai5j2dphrhdo0cbjjdisd4vn.apps.googleusercontent.com` |
| Client Secret | your `GOCSPX-...` secret (server-side value, never in this repo) |
| Skip nonce checks | off (default) |

Meantime: **Authentication → URL Configuration**:

| Field | Value |
| --- | --- |
| Site URL | `https://indy-cmmi.onrender.com` |
| Redirect URLs | add `https://indy-cmmi.onrender.com/**` and `http://localhost:8443/**` |

Then copy the **Callback URL (for OAuth)** Supabase shows on the Google provider
screen — it looks like:

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

That exact URL must be added to Google Cloud Console (step 4).

Supabase API values for the `VITE_SUPABASE_*` vars above:
Dashboard → **Settings → API** → *Project URL* and the **anon public** key
(not the `service_role` key, not a `postgres:...` connection string).

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

> **Crucial:** if your deployed site shows `403 Blocked request. This host
> ("...") is not allowed.`, that is Vite 8's host check in `vite preview`.
> Fixed in `vite.config.ts` with `preview.allowedHosts: true` (and
> `server.allowedHosts: true` for dev). Redeploy after pulling that change.

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
