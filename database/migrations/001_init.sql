-- Create users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  username text unique not null,
  created_at timestamp default now()
);

-- Create characters table
create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references users(id) on delete cascade,
  name text not null,
  description text,
  embedding vector(1536),
  created_at timestamp default now()
);

-- Create videos table
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references characters(id) on delete cascade,
  url text not null,
  duration integer not null,
  quality integer not null,
  cost numeric(10, 2),
  created_at timestamp default now()
);

-- Create game_progress table
create table if not exists game_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  difficulty integer not null,
  score integer not null,
  hints_used integer not null,
  completed boolean default false,
  created_at timestamp default now()
);

-- Create indexes
create index if not exists idx_characters_creator on characters(creator_id);
create index if not exists idx_videos_character on videos(character_id);
create index if not exists idx_game_progress_user on game_progress(user_id);
