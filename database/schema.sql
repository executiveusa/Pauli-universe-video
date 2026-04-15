-- Complete Pauli Universe Database Schema
-- Aggregated from all migrations

-- Extensions
create extension if not exists vector;

-- Users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  username text unique not null,
  created_at timestamp default now()
);

-- Characters
create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references users(id) on delete cascade,
  name text not null,
  description text,
  embedding vector(1536),
  created_at timestamp default now()
);

-- Videos
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references characters(id) on delete cascade,
  url text not null,
  duration integer not null,
  quality integer not null,
  cost numeric(10, 2),
  created_at timestamp default now()
);

-- Game Progress
create table if not exists game_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  difficulty integer not null,
  score integer not null,
  hints_used integer not null,
  completed boolean default false,
  created_at timestamp default now()
);

-- Character Consistency
create table if not exists character_consistency (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references characters(id) on delete cascade,
  frame_sequence text[] not null,
  consistency_score numeric(3, 2),
  verified boolean default false,
  created_at timestamp default now()
);

-- Character Projects
create table if not exists character_projects (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references characters(id) on delete cascade,
  project_id uuid not null,
  role text,
  created_at timestamp default now()
);

-- Video Metadata
create table if not exists video_metadata (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references videos(id) on delete cascade,
  generation_cost numeric(10, 2),
  flux_cost numeric(10, 2),
  kling_cost numeric(10, 2),
  modal_cost numeric(10, 2),
  color_grade_preset text,
  quality_score numeric(3, 2),
  created_at timestamp default now()
);

-- Video Reviews
create table if not exists video_reviews (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references videos(id) on delete cascade,
  reviewer_id uuid references users(id),
  rating integer,
  comments text,
  created_at timestamp default now()
);

-- Leaderboard
create table if not exists leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  score integer not null,
  difficulty integer not null,
  rank integer,
  created_at timestamp default now()
);

-- Episodes
create table if not exists episodes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  episode_number integer not null,
  title text not null,
  description text,
  generated_at timestamp,
  published_at timestamp,
  created_at timestamp default now()
);

-- Affiliate Commissions
create table if not exists affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references users(id),
  referrer_id uuid references users(id),
  commission_amount numeric(10, 2),
  status text default 'pending',
  created_at timestamp default now()
);

-- Indexes
create index if not exists idx_characters_creator on characters(creator_id);
create index if not exists idx_videos_character on videos(character_id);
create index if not exists idx_game_progress_user on game_progress(user_id);
create index if not exists idx_consistency_character on character_consistency(character_id);
create index if not exists idx_projects_character on character_projects(character_id);
create index if not exists idx_metadata_video on video_metadata(video_id);
create index if not exists idx_reviews_video on video_reviews(video_id);
create index if not exists idx_leaderboard_user on leaderboard(user_id);
create index if not exists idx_leaderboard_score on leaderboard(score desc);
create index if not exists idx_episodes_project on episodes(project_id);
create index if not exists idx_affiliates_creator on affiliate_commissions(creator_id);
