-- Add video metadata table
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

-- Add video reviews table
create table if not exists video_reviews (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references videos(id) on delete cascade,
  reviewer_id uuid references users(id),
  rating integer,
  comments text,
  created_at timestamp default now()
);

create index if not exists idx_metadata_video on video_metadata(video_id);
create index if not exists idx_reviews_video on video_reviews(video_id);
