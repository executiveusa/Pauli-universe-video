from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
import logging

from routers import videos, assets, llm, cloud_sync, integrations
from database import init_db
from agent import VideoStudioAgent

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Video Studio Agent",
    description="AI-powered video management and creation service",
    version="0.0.1"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()
    logger.info("Video Studio Agent initialized")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "video-studio-agent"}

@app.post("/sync")
async def trigger_sync(background_tasks: BackgroundTasks):
    background_tasks.add_task(cloud_sync.sync_all_clouds)
    return {"status": "sync_queued"}

@app.get("/videos")
async def list_videos(
    month: Optional[str] = None,
    tags: Optional[str] = None,
    duration_min: Optional[int] = None,
    duration_max: Optional[int] = None,
    quality: Optional[str] = None,
    limit: int = 50
):
    return await videos.query_videos(
        month=month,
        tags=tags,
        duration_min=duration_min,
        duration_max=duration_max,
        quality=quality,
        limit=limit
    )

@app.get("/videos/{video_id}")
async def get_video(video_id: str):
    return await videos.get_video_details(video_id)

@app.post("/analyze/{video_id}")
async def analyze_video(video_id: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(videos.analyze_with_vision, video_id)
    return {"status": "analysis_queued", "video_id": video_id}

@app.post("/organize")
async def organize_videos(background_tasks: BackgroundTasks):
    background_tasks.add_task(videos.reorganize_all)
    return {"status": "organization_queued"}

@app.get("/collections")
async def list_collections():
    return await videos.get_smart_collections()

@app.post("/assets/generate")
async def generate_asset(
    video_id: str,
    asset_type: str,
    params: dict,
    background_tasks: BackgroundTasks
):
    job_id = await assets.queue_generation(video_id, asset_type, params)
    background_tasks.add_task(assets.process_generation, job_id)
    return {"job_id": job_id, "status": "queued"}

@app.post("/assets/generate-intro")
async def generate_intro(
    prompt: str,
    duration: int = 5,
    background_tasks: BackgroundTasks
):
    job_id = await assets.queue_intro_generation(prompt, duration)
    background_tasks.add_task(assets.process_intro, job_id)
    return {"job_id": job_id, "status": "generating_intro"}

@app.post("/assets/generate-video")
async def generate_video(
    prompt: str,
    seed: Optional[int] = None,
    background_tasks: BackgroundTasks
):
    job_id = await assets.queue_video_generation(prompt, seed)
    background_tasks.add_task(assets.process_seedance_video, job_id)
    return {"job_id": job_id, "status": "generating_video"}

@app.post("/assets/add-voice")
async def add_voice(
    video_id: str,
    text: str,
    voice_id: Optional[str] = None,
    background_tasks: BackgroundTasks
):
    job_id = await assets.queue_voice_generation(video_id, text, voice_id)
    background_tasks.add_task(assets.process_mercury2_voice, job_id)
    return {"job_id": job_id, "status": "adding_voice"}

@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    return await assets.get_job_status(job_id)

@app.post("/chat")
async def chat(message: str, context: Optional[dict] = None):
    agent = VideoStudioAgent()
    response = await agent.process_message(message, context)
    return {"response": response}

@app.post("/integrate/premiere")
async def export_to_premiere(video_ids: List[str]):
    return await integrations.export_premiere_edl(video_ids)

@app.post("/integrate/davinci")
async def export_to_davinci(video_ids: List[str]):
    return await integrations.export_davinci_xml(video_ids)

@app.post("/llm/set-provider")
async def set_llm_provider(provider: str, config: dict):
    return await llm.configure_provider(provider, config)

@app.post("/llm/sync-chatgpt")
async def sync_chatgpt_account(auth_code: str):
    return await llm.oauth_chatgpt_sync(auth_code)

app.include_router(videos.router)
app.include_router(assets.router)
app.include_router(llm.router)
app.include_router(cloud_sync.router)
app.include_router(integrations.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
