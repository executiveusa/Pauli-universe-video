import os
from supabase import create_client, Client
from typing import Optional
import logging

logger = logging.getLogger(__name__)

supabase: Optional[Client] = None

def init_db():
    global supabase
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")

    supabase = create_client(supabase_url, supabase_key)
    logger.info("Database initialized")

def get_db() -> Client:
    if supabase is None:
        init_db()
    return supabase

class VideoRepository:
    @staticmethod
    async def create_video(data: dict):
        db = get_db()
        result = db.table("videos").insert(data).execute()
        return result.data[0] if result.data else None

    @staticmethod
    async def get_video(video_id: str):
        db = get_db()
        result = db.table("videos").select("*").eq("id", video_id).execute()
        return result.data[0] if result.data else None

    @staticmethod
    async def list_videos(filters: dict = None, limit: int = 50):
        db = get_db()
        query = db.table("videos").select("*")

        if filters:
            if filters.get("month"):
                query = query.ilike("month", f"%{filters['month']}%")
            if filters.get("quality"):
                query = query.eq("quality", filters["quality"])
            if filters.get("duration_min"):
                query = query.gte("duration", filters["duration_min"])
            if filters.get("duration_max"):
                query = query.lte("duration", filters["duration_max"])

        result = query.limit(limit).execute()
        return result.data

    @staticmethod
    async def update_video(video_id: str, data: dict):
        db = get_db()
        result = db.table("videos").update(data).eq("id", video_id).execute()
        return result.data[0] if result.data else None

class MetadataRepository:
    @staticmethod
    async def save_metadata(video_id: str, metadata: dict):
        db = get_db()
        data = {
            "video_id": video_id,
            "analysis": metadata.get("analysis", {}),
            "tags": metadata.get("tags", []),
            "scenes": metadata.get("scenes", []),
            "detected_text": metadata.get("detected_text", []),
            "people": metadata.get("people", []),
            "objects": metadata.get("objects", []),
            "color_palette": metadata.get("color_palette", []),
            "audio_description": metadata.get("audio_description", "")
        }
        result = db.table("video_metadata").insert(data).execute()
        return result.data[0] if result.data else None

    @staticmethod
    async def get_metadata(video_id: str):
        db = get_db()
        result = db.table("video_metadata").select("*").eq("video_id", video_id).execute()
        return result.data[0] if result.data else None

class JobRepository:
    @staticmethod
    async def create_job(job_type: str, video_id: str = None, params: dict = None):
        db = get_db()
        data = {
            "type": job_type,
            "video_id": video_id,
            "params": params or {},
            "status": "pending"
        }
        result = db.table("video_jobs").insert(data).execute()
        return result.data[0] if result.data else None

    @staticmethod
    async def get_job(job_id: str):
        db = get_db()
        result = db.table("video_jobs").select("*").eq("id", job_id).execute()
        return result.data[0] if result.data else None

    @staticmethod
    async def update_job(job_id: str, status: str, result: dict = None):
        db = get_db()
        data = {"status": status}
        if result:
            data["result"] = result
        result = db.table("video_jobs").update(data).eq("id", job_id).execute()
        return result.data[0] if result.data else None

class IntegrationRepository:
    @staticmethod
    async def save_integration(integration_type: str, config: dict, user_id: str = None):
        db = get_db()
        data = {
            "type": integration_type,
            "config": config,
            "user_id": user_id
        }
        result = db.table("integrations").insert(data).execute()
        return result.data[0] if result.data else None

    @staticmethod
    async def get_integration(integration_type: str):
        db = get_db()
        result = db.table("integrations").select("*").eq("type", integration_type).execute()
        return result.data[0] if result.data else None
