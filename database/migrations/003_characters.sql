-- Add character consistency table
create table if not exists character_consistency (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references characters(id) on delete cascade,
  frame_sequence text[] not null,
  consistency_score numeric(3, 2),
  verified boolean default false,
  created_at timestamp default now()
);

-- Add character projects table
create table if not exists character_projects (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references characters(id) on delete cascade,
  project_id uuid not null,
  role text,
  created_at timestamp default now()
);

create index if not exists idx_consistency_character on character_consistency(character_id);
create index if not exists idx_projects_character on character_projects(character_id);
