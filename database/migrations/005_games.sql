-- Add leaderboard table
create table if not exists leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  score integer not null,
  difficulty integer not null,
  rank integer,
  created_at timestamp default now()
);

-- Add episodes table
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

-- Add affiliates table
create table if not exists affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references users(id),
  referrer_id uuid references users(id),
  commission_amount numeric(10, 2),
  status text default 'pending',
  created_at timestamp default now()
);

create index if not exists idx_leaderboard_user on leaderboard(user_id);
create index if not exists idx_leaderboard_score on leaderboard(score desc);
create index if not exists idx_episodes_project on episodes(project_id);
create index if not exists idx_affiliates_creator on affiliate_commissions(creator_id);
