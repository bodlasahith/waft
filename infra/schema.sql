-- Supabase/Postgres schema for Waft
--
-- SECURITY POSTURE (RLS): every table below has Row Level Security ENABLED with
-- ZERO policies. This is intentional. The API is the only writer/reader and it
-- connects with the Supabase service-role key, which bypasses RLS entirely.
-- RLS-enabled-with-no-policies is therefore a *backstop*: if the public anon key
-- ever leaks, it can read/write nothing (no policy = deny-all under RLS). Do NOT
-- add permissive policies without re-checking this assumption — a single `using
-- (true)` policy would turn the anon key into full table access.
--
-- This file is the source of truth for that posture. It previously drifted from
-- the live database (RLS was toggled in the Supabase dashboard, uncodified);
-- verified against prod 2026-07-27 — all five public tables: rls=on, policies=0.

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  photo_url text,
  card_code text unique not null,
  created_at timestamptz default now()
);
alter table users enable row level security;

create table social_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  platform text not null,
  handle text not null,
  url text,
  visibility text not null default 'public',  -- 'public' | 'mutual_only' | 'event_only'
  created_at timestamptz default now(),
  unique(user_id, platform)
);
alter table social_links enable row level security;

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
alter table events enable row level security;

-- User feedback / bug reports from the web contact form. Writes go through the
-- API's service-role key; RLS-with-no-policies keeps the anon key out (this was
-- world-readable via the anon key until RLS was enabled 2026-07-21).
create table feedback (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  category text,
  subject text,
  body text not null,
  created_at timestamptz default now()
);
alter table feedback enable row level security;

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
