# Video Studio Agent

AI-powered video management and creative asset generation service for content creators.

## Features

### 🎬 Video Management
- **Cloud Storage Integration**: Google Drive, Dropbox, OneDrive
- **Vision Analysis**: Claude 4.7 vision to extract metadata, detect scenes, people, objects
- **Smart Organization**: Auto-group by month, quality, detected events
- **Metadata Extraction**: Duration, resolution, audio, transcripts, color palettes

### 🎨 Asset Generation
- **SeedDance Videos**: Generate videos from text prompts
- **cdance Intros**: Motion-based intro generation
- **Hyperframe**: Auto-generate thumbnails, clips, captions
- **Mercury 2 Voices**: AI voices and avatar composition

### 🤖 LLM Support
- **Model Agnostic**: Use any LLM via LiteLLM (Anthropic, OpenAI, Google, etc.)
- **BYOK**: Bring your own API key
- **ChatGPT OAuth**: Log in with ChatGPT subscription
- **Easy Switching**: Change providers without re-deployment

### 💬 Multi-Channel Interface
- **Telegram**: Native Telegram bot integration
- **WhatsApp**: WhatsApp Business API support
- **Web Dashboard**: React UI in Engine app
- **Natural Language**: Talk to your videos naturally

### 🎥 Editor Integration
- **Adobe Premiere**: EDL and XMEML export
- **DaVinci Resolve**: Timeline XML export
- **Extensible**: Easy to add more editor support

## Setup

### 1. Environment Variables
```bash
cp .env.example .env
# Fill in your API keys
```

### 2. Database
```bash
# Run migrations on Supabase
psql "postgresql://..." < database/001_init.sql
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Start Service
```bash
# Development
python src/main.py

# Production (Docker)
docker build -t video-studio-agent .
docker run -p 8000:8000 --env-file .env video-studio-agent
```

## Usage

### Via Chat Interface (Engine Dashboard)
1. Navigate to Engine app
2. Click "AI Chat" tab
3. Ask naturally: "Generate a video about coffee making"

### Via API

**List Videos**
```bash
curl http://localhost:8000/videos?month=2026-03&quality=4K
```

**Generate Video**
```bash
curl -X POST http://localhost:8000/assets/generate/video \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A cinematic coffee making tutorial"}'
```

**Add Voice**
```bash
curl -X POST http://localhost:8000/assets/generate/voice \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "xyz",
    "text": "Welcome to our channel!",
    "voice_id": "default"
  }'
```

**Export to Premiere**
```bash
curl -X POST http://localhost:8000/integrate/premiere/edl \
  -H "Content-Type: application/json" \
  -d '{"video_ids": ["id1", "id2", "id3"]}'
```

### Via Telegram
1. Start bot: `/start`
2. Send message: "Show me videos from March"
3. Or: "Generate a 5-second intro for gaming"

## Architecture

```
User (Telegram/WhatsApp/Web)
    ↓
Video Studio Agent
    ├─ Vision Analysis (Claude 4.7)
    ├─ Cloud Storage (Drive, Dropbox, OneDrive)
    ├─ Video Generation (SeedDance, cdance)
    ├─ Voice Generation (Mercury 2)
    ├─ Asset Generation (Hyperframe)
    ├─ LLM Support (LiteLLM)
    └─ Editors (Premiere, DaVinci)
    ↓
Supabase (PostgreSQL)
```

## Capabilities by Intent

| User Says | Agent Does |
|-----------|-----------|
| "Show videos from March" | Queries library by month |
| "Make a highlight reel" | Generates clips with Hyperframe |
| "Create intro about X" | Generates motion intro with cdance |
| "Make a video about Y" | Generates video with SeedDance |
| "Add voice to this" | Adds AI voice + avatar with Mercury 2 |
| "Export to Premiere" | Generates EDL for editing |
| "Organize by people" | Runs vision analysis, groups by detected people |
| "What's in this video?" | Analyzes with Claude vision, returns metadata |

## LLM Configuration

### Use Anthropic Claude
```bash
curl -X POST http://localhost:8000/llm/provider/set \
  -d "provider=anthropic&model=claude-opus-4-1&api_key=sk-ant-xxx"
```

### Use OpenAI with ChatGPT subscription
```bash
# 1. Get auth URL
curl http://localhost:8000/llm/oauth/chatgpt/url

# 2. Click link to authenticate

# 3. Callback will sync automatically
```

### Use any LLM via LiteLLM
```bash
curl -X POST http://localhost:8000/llm/provider/litellm \
  -d "provider=google&model=gemini-pro&api_key=xxx"
```

## Async Processing

Long-running jobs (video generation, voice synthesis) are queued and processed asynchronously.

**Check job status:**
```bash
curl http://localhost:8000/jobs/{job_id}
```

Response:
```json
{
  "job_id": "abc123",
  "status": "completed|processing|failed",
  "type": "seedance_generation",
  "result": {...}
}
```

## Database Schema

- `videos`: Video library (metadata, source, duration)
- `video_metadata`: Vision analysis results (scenes, people, objects, text)
- `video_jobs`: Async job tracking
- `smart_collections`: Auto-grouped videos
- `integrations`: OAuth tokens, API configs

## Troubleshooting

**Vision analysis fails**
- Check Anthropic API key
- Ensure video frames are extractable

**Cloud storage sync empty**
- Verify Google Drive / Dropbox / OneDrive credentials
- Check bucket/folder paths

**Asset generation queued but never completes**
- Check job status: `/jobs/{id}`
- Verify third-party API keys (SeedDance, Mercury 2, Hyperframe)
- Check Redis/Celery is running

**LLM provider not switching**
- Make sure new provider credentials are valid
- Check: `/llm/provider/current`

## Future Enhancements

- [ ] Real-time video processing with streaming
- [ ] Custom AI model fine-tuning
- [ ] Advanced timeline editing
- [ ] Multi-language support
- [ ] Batch processing with scheduling
- [ ] Performance analytics dashboard

## License

MIT
