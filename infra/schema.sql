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

create index idx_social_links_user on social_links(user_id);
create index idx_social_links_visibility on social_links(user_id, visibility);
create index idx_events_code on events(code);
create index idx_users_card_code on users(card_code);
