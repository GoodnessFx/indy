// Support chat storage for cross-device sync. Run once in Supabase
// Dashboard -> SQL Editor, then set VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY on Render (and restart the local dev server).
//
// Both the client support widget and the admin console read and write this
// single table, so an admin can sign in from any device in the world and reply
// to the same conversation, and the client resumes where they left off.

create table if not exists support_messages (
  id text primary key,
  account text not null,
  name text not null default '',
  sender text not null check (sender in ('client', 'agent')),
  body text not null,
  sent_at timestamptz not null default now()
);

create index if not exists support_messages_account_idx
  on support_messages (account, sent_at);

-- Public anon read/write so the signed-in web app can use it without a
-- server layer. Swap to per-user RLS as soon as you add real auth rows.
alter table support_messages enable row level security;

create policy "anon read support messages"
  on support_messages for select
  using (true);

create policy "anon write support messages"
  on support_messages for insert
  with check (true);

create policy "anon update support messages"
  on support_messages for update
  using (true);
