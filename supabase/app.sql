// Indy shared database — Supabase tables that work from any static host
// (no server.js required), so client + admin on different devices/countries
// read and write the SAME rows.
//
// Run once in Supabase Dashboard -> SQL Editor (safe to re-run):
//   1. supabase/chat.sql   (support_messages)
//   2. supabase/app.sql    (this file: users, logins, seen flag)
//
// Then set on the host (Render env) + local .env:
//   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
//   VITE_SUPABASE_ANON_KEY=<anon public key>
//
// When those are missing, the app falls back to /api/chat (server.js) and
// then to per-browser localStorage — which is exactly why two browsers on
// the same PC see nothing from each other in production right now.

create table if not exists support_messages (
  id text primary key,
  account text not null,
  name text not null default '',
  sender text not null check (sender in ('client', 'agent')),
  body text not null,
  sent_at timestamptz not null default now()
);

-- Read-receipt flag the chat UI needs (chat.sql predates it).
alter table support_messages add column if not exists seen boolean not null default false;

create index if not exists support_messages_account_idx
  on support_messages (account, sent_at);

-- One row per signup. No FK to auth.users: the app uses Google GIS +
-- local email sessions, so email is the stable cross-device key.
create table if not exists indy_users (
  email text primary key,
  name text not null default '',
  created_at timestamptz not null default now(),
  last_login_at timestamptz,
  login_count integer not null default 0
);

-- Every successful sign-in appends one row (never just "latest").
create table if not exists indy_login_events (
  id text primary key,
  email text not null,
  name text not null default '',
  method text not null default 'email',
  at timestamptz not null default now()
);

create index if not exists indy_login_events_email_idx
  on indy_login_events (email, at desc);

alter table support_messages enable row level security;
alter table indy_users enable row level security;
alter table indy_login_events enable row level security;

-- Anon read/write so the signed-in web app works without a server layer.
-- Tighten to per-user RLS once real auth rows exist.
create policy "anon read support messages"
  on support_messages for select using (true);
create policy "anon write support messages"
  on support_messages for insert with check (true);
create policy "anon update support messages"
  on support_messages for update using (true);

create policy "anon read indy users"
  on indy_users for select using (true);
create policy "anon write indy users"
  on indy_users for insert with check (true);
create policy "anon update indy users"
  on indy_users for update using (true);

create policy "anon read indy logins"
  on indy_login_events for select using (true);
create policy "anon write indy logins"
  on indy_login_events for insert with check (true);
