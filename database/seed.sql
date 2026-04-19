-- Test data for development

-- Insert test users
insert into users (email, username) values
  ('pauli@example.com', 'pauli'),
  ('creator@example.com', 'creator'),
  ('player@example.com', 'player')
on conflict do nothing;

-- Insert test characters
insert into characters (creator_id, name, description)
select id, 'Pauli', 'The famous quantum physicist'
from users where username = 'pauli'
on conflict do nothing;

-- Insert test videos
insert into videos (character_id, url, duration, quality, cost)
select id, 'https://example.com/video1.mp4', 60, 85, 3.10
from characters where name = 'Pauli' limit 1
on conflict do nothing;

-- Insert test game progress
insert into game_progress (user_id, difficulty, score, hints_used, completed)
select id, 3, 250, 1, true
from users where username = 'player'
on conflict do nothing;
