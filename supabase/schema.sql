-- IndySolutions schema, run this whole file in Supabase Dashboard -> SQL Editor.
-- Mirrors the backend spec: multi-asset portfolios, withdrawals, KYC, support chat, admin.

create type asset_type as enum ('nft', 'stock', 'vehicle', 'other');
create type tx_type as enum ('deposit', 'withdrawal', 'buy', 'sell', 'fee');
create type tx_status as enum ('pending', 'completed', 'failed');
create type kyc_state as enum ('unverified', 'pending', 'verified', 'rejected');
create type withdrawal_status as enum ('pending', 'processing', 'completed', 'failed');

create table users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade, -- links to Supabase auth
  name text not null,
  email text unique not null,
  phone text,
  country text,
  profile_picture_url text,
  kyc_status kyc_state not null default 'unverified',
  preferred_language text not null default 'en',
  preferred_currency text not null default 'USD',
  notification_prefs jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table kyc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  document_type text not null,
  file_url text not null,
  status kyc_state not null default 'pending',
  reviewed_by uuid, -- admin id, nullable
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table assets (
  id text primary key,                       -- e.g. 'nft-1', 'TSLA', 'model-3'
  asset_type asset_type not null,
  name text not null,
  description text,
  image_url text,
  current_price numeric not null default 0,
  metadata jsonb not null default '{}',      -- NFT traits, ticker/exchange, category
  updated_at timestamptz not null default now()
);

create table portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  asset_type asset_type not null,
  asset_id text not null references assets(id),
  quantity numeric not null default 0,
  cost_basis numeric not null default 0,
  current_value numeric not null default 0,
  acquired_at timestamptz not null default now(),
  unique (user_id, asset_id)
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type tx_type not null,
  asset_type asset_type,
  amount numeric not null,
  currency text not null default 'USD',
  status tx_status not null default 'pending',
  reference text,                            -- processor reference, never raw card data
  created_at timestamptz not null default now()
);

create table withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  source_asset_type asset_type,
  amount_requested numeric not null,
  currency_from text not null,
  currency_to text not null,
  fx_rate_locked numeric not null,
  tax_withheld numeric not null default 0,
  platform_fee numeric not null default 0,
  net_amount numeric not null,
  payout_method text not null check (payout_method in ('bank', 'card')),
  payout_destination_id uuid,
  processor_reference text,                  -- Stripe/payout provider id only, never account numbers
  status withdrawal_status not null default 'pending',
  status_history jsonb not null default '[]',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table payout_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('bank', 'card')),
  masked_details text not null,              -- last 4 only, e.g. 'Visa ****1111'
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  email text not null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table support_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'waiting_on_user', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references support_threads(id) on delete cascade,
  sender_type text not null check (sender_type in ('user', 'admin')),
  sender_id uuid not null,
  body text not null,
  attachment_url text,
  created_at timestamptz not null default now()
);

-- Admins are a fully separate table. Never a role flag on users.
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,               -- bcrypt/argon2, never plaintext
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references admin_users(id),
  action text not null,
  target_user_id uuid references users(id),
  changes jsonb not null default '{}',       -- { field: { before, after } }
  created_at timestamptz not null default now()
);

create table seed_prices_cache (              -- market-data cache, 30s TTL pattern
  symbol text primary key,
  price numeric not null,
  fetched_at timestamptz not null default now()
);

-- Helpful indexes
create index idx_tx_user on transactions(user_id, created_at desc);
create index idx_tx_status on transactions(status);
create index idx_withdrawals_user on withdrawals(user_id, created_at desc);
create index idx_login_events_user on login_events(user_id, created_at desc);
create index idx_portfolios_user on portfolios(user_id);
create index idx_support_messages_thread on support_messages(thread_id, created_at);
create index idx_audit_admin on admin_audit_log(admin_id, created_at desc);

-- Row-level security baseline: users only see their own rows. Admin reads go
-- through a server-side service role, never the anon key.
alter table users enable row level security;
alter table portfolios enable row level security;
alter table transactions enable row level security;
alter table withdrawals enable row level security;
alter table payout_methods enable row level security;
alter table support_threads enable row level security;
alter table support_messages enable row level security;

create policy "own rows" on users for select using (auth_user_id = auth.uid());
create policy "own rows" on portfolios for select using (user_id in (select id from users where auth_user_id = auth.uid()));
create policy "own rows" on transactions for select using (user_id in (select id from users where auth_user_id = auth.uid()));
create policy "own rows" on withdrawals for select using (user_id in (select id from users where auth_user_id = auth.uid()));
create policy "own rows" on payout_methods for all using (user_id in (select id from users where auth_user_id = auth.uid()));
create policy "own rows" on support_threads for select using (user_id in (select id from users where auth_user_id = auth.uid()));
create policy "own rows" on support_messages for select using (thread_id in (select id from support_threads where user_id in (select id from users where auth_user_id = auth.uid())));
