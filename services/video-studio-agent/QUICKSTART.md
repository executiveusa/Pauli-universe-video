# Video Studio Agent - Quick Start

## 1-Minute Setup

```bash
# Copy environment
cp .env.example .env

# Edit .env with your API keys:
# - ANTHROPIC_API_KEY
# - HUGGINGFACE_API_KEY
# - SUPABASE_URL + SUPABASE_KEY
# - MERCURY_API_KEY
# - TELEGRAM_BOT_TOKEN (optional)

# Install & run
pip install -r requirements.txt
python src/main.py
```

Visit: `http://localhost:8000/docs` (Swagger UI)

## What It Does

A creative AI studio that creators control via Telegram, WhatsApp, or web dashboard.

### Example Workflows

**Workflow 1: Organize existing videos**
```
Creator: "Show me videos from last month"
Agent: Lists all videos with metadata
Creator: Clicks "Analyze" on one
Agent: Runs Claude vision → extracts people, scenes, text
Result: Video automatically tagged and organized
```

**Workflow 2: Generate intro + add voice**
```
Creator: "Create a 5-second dance intro"
Agent: Uses cdance → generates motion video
Creator: "Add voice to that intro: Welcome to my channel!"
Agent: Uses Mercury 2 → adds voice + AI avatar
Result: Ready-to-use intro with branded avatar
```

**Workflow 3: Create full video from scratch**
```
Creator: "Make a 60-second video about sustainable coffee"
Agent: Uses SeedDance → generates video from prompt
Creator: "Add 10 short-form clips for TikTok"
Agent: Uses Hyperframe → creates 10 x 15-sec clips + captions
Creator: "Export to Premiere"
Agent: Generates EDL → can open in Adobe Premiere
Result: Video + clips + captions ready in editor
```

**Workflow 4: Smart organization**
```
Creator: "Organize all my videos by who's in them"
Agent: Analyzes all videos with Claude vision
Result: Auto-grouped by detected people + collections
Creator: "Show me all videos with Alex"
Agent: Filters collection
```

## Key Features at a Glance

| Feature | Tool |
|---------|------|
| **Video Search** | Supabase (SQL queries) |
| **Scene Understanding** | Claude 4.7 Vision |
| **Video Generation** | SeedDance (HuggingFace) |
| **Intro/Motion** | cdance |
| **Thumbnails/Clips** | Hyperframe |
| **Voice & Avatar** | Mercury 2 (Clarity Labs) |
| **Chat** | Claude Opus 4.1 |
| **Cloud Storage** | Google Drive, Dropbox, OneDrive |
| **Editors** | Adobe Premiere, DaVinci Resolve |
| **LLM** | Any model via LiteLLM |

## API Endpoints (Core)

```
GET    /videos              - List all videos (filterable)
POST   /sync                - Sync cloud storage
POST   /analyze/{video_id}  - Run vision analysis
POST   /assets/generate/video     - Generate video (SeedDance)
POST   /assets/generate/intro     - Generate intro (cdance)
POST   /assets/generate/voice     - Add voice + avatar (Mercury 2)
POST   /integrate/premiere/edl    - Export to Adobe Premiere
POST   /integrate/davinci/timeline - Export to DaVinci Resolve
POST   /chat                - Talk to AI agent
POST   /llm/provider/set    - Change LLM (OpenAI, Google, etc.)
```

## Next Steps

1. **Set API keys** in `.env` file
2. **Start service** (`python src/main.py`)
3. **Open docs** (`http://localhost:8000/docs`)
4. **Test endpoints** in Swagger UI
5. **Connect from Engine** app (video studio dashboard will appear)
6. **Chat with it** - "Show me videos from March"

## Telegram Setup (Optional)

1. Create bot with @BotFather on Telegram
2. Get token → add to `.env` as `TELEGRAM_BOT_TOKEN`
3. Restart service
4. Start chatting with bot on Telegram

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Module not found" | `pip install -r requirements.txt` |
| "API key error" | Check `.env` file - all keys must be set |
| "Database connection failed" | Verify SUPABASE_URL + SUPABASE_KEY |
| "No videos found" | Click "Sync Cloud Storage" button first |
| "Generation times out" | Check job status (`/jobs/{id}`) |

## What's Inside

```
services/video-studio-agent/
├── src/
│   ├── main.py              # FastAPI app
│   ├── agent.py             # AI agent logic
│   ├── database.py          # Supabase ORM
│   └── routers/
│       ├── videos.py        # Video search + analysis
│       ├── assets.py        # Generation (SeedDance, cdance, Mercury 2)
│       ├── llm.py           # LiteLLM provider support
│       ├── cloud_sync.py    # Drive, Dropbox, OneDrive
│       └── integrations.py  # Premiere, DaVinci exports
├── database/
│   └── 001_init.sql         # Supabase schema
├── requirements.txt         # Python dependencies
├── Dockerfile               # For production deploy
└── README.md                # Full docs
```

## Production Deployment

**Docker:**
```bash
docker build -t video-studio-agent .
docker run -p 8000:8000 --env-file .env video-studio-agent
```

**Modal.com (serverless):**
```python
# Add to src/main.py
import modal

app = modal.App("video-studio-agent")

@app.function()
@modal.asgi_app()
def fastapi_app():
    return app  # FastAPI app
```

Deploy: `modal deploy src/main.py`

## Support

Questions? Check:
- Swagger docs: `http://localhost:8000/docs`
- Agent logs: Look for "Video Studio Agent" in console
- Job status: `/jobs/{id}` endpoint
