-- Supabase/Postgres schema for Waft

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  photo_url text,
  card_code text unique not null,
  created_at timestamptz default now()
);

create table social_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  platform text not null,
  handle text not null,
  url text,
  visibility text not null default 'public',
  created_at timestamptz default now(),
  unique(user_id, platform)
);

create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- Invite connections queued from a web card before the invitee has an
-- account. Fulfilled (and deleted) in POST /users when someone signs up with
-- the matching email. RLS enabled with no policies — the API writes/reads via
-- the service key; the anon key gets nothing.
create table pending_connections (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references users(id) on delete cascade,
  invitee_email text not null,
  created_at timestamptz default now(),
  unique(from_user_id, invitee_email)
);
alter table pending_connections enable row level security;

create index idx_pending_connections_email on pending_connections(invitee_email);
create index idx_social_links_user on social_links(user_id);
create index idx_social_links_visibility on social_links(user_id, visibility);
create index idx_events_code on events(code);
create index idx_users_card_code on users(card_code);
