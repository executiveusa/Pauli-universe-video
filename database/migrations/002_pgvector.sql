-- Enable pgvector extension for semantic search
create extension if not exists vector;

-- Create similarity search function
create or replace function match_characters(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  name text,
  description text,
  similarity float
)
language sql
as $$
  select
    characters.id,
    characters.name,
    characters.description,
    1 - (characters.embedding <=> query_embedding) as similarity
  from characters
  where characters.embedding is not null
    and 1 - (characters.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
