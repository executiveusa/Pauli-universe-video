-- Video Studio Agent Schema

-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  size BIGINT,
  duration INT,
  quality VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  month VARCHAR(7),
  analyzed BOOLEAN DEFAULT FALSE,
  metadata JSONB
);

CREATE INDEX idx_videos_month ON videos(month);
CREATE INDEX idx_videos_source ON videos(source);
CREATE INDEX idx_videos_quality ON videos(quality);
CREATE INDEX idx_videos_created_at ON videos(created_at);

-- Video metadata (vision analysis)
CREATE TABLE video_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  analysis JSONB,
  tags TEXT[] DEFAULT '{}',
  scenes TEXT[] DEFAULT '{}',
  detected_text TEXT[] DEFAULT '{}',
  people TEXT[] DEFAULT '{}',
  objects TEXT[] DEFAULT '{}',
  color_palette TEXT[] DEFAULT '{}',
  audio_description TEXT,
  analyzed_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_metadata_video_id ON video_metadata(video_id);
CREATE INDEX idx_metadata_tags ON video_metadata USING GIN (tags);
CREATE INDEX idx_metadata_people ON video_metadata USING GIN (people);

-- Jobs (async processing)
CREATE TABLE video_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending',
  params JSONB,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_jobs_status ON video_jobs(status);
CREATE INDEX idx_jobs_type ON video_jobs(type);
CREATE INDEX idx_jobs_video_id ON video_jobs(video_id);

-- Integrations (OAuth, API configs)
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL UNIQUE,
  config JSONB,
  user_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_integrations_user_id ON integrations(user_id);

-- Smart collections (auto-grouped videos)
CREATE TABLE smart_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  collection_type VARCHAR(50),
  video_ids UUID[] DEFAULT '{}',
  filter_params JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_collections_type ON smart_collections(collection_type);
CREATE INDEX idx_collections_video_ids ON smart_collections USING GIN (video_ids);

-- Enable RLS for security
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_collections ENABLE ROW LEVEL SECURITY;
