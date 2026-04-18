-- Enable pgvector extension
create extension if not exists vector;

-- Create characters table
create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  embedding vector(768) not null,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- Create index for vector similarity search (IVFFlat for large datasets)
create index if not exists idx_characters_embedding
  on characters
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Create index on created_at for time-based queries
create index if not exists idx_characters_created_at on characters(created_at desc);

-- Search function for similarity matching
create or replace function search_characters(
  query_embedding vector(768),
  similarity_threshold float,
  match_count int
)
returns table(
  id uuid,
  name text,
  similarity float,
  metadata jsonb
) as $$
  select
    c.id,
    c.name,
    (1 - (c.embedding <=> query_embedding)) as similarity,
    c.metadata
  from characters c
  where (1 - (c.embedding <=> query_embedding)) > similarity_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$ language sql stable;
