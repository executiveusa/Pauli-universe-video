from fastapi import APIRouter, HTTPException
from typing import Optional, List
import logging
import base64
from anthropic import Anthropic
from database import VideoRepository, MetadataRepository
import httpx
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/videos", tags=["videos"])

class VisionAnalyzer:
    def __init__(self):
        self.client = Anthropic()

    async def analyze_frames(self, video_id: str, frames: List[bytes]) -> dict:
        analysis = {
            "scenes": [],
            "detected_text": [],
            "people": [],
            "objects": [],
            "color_palette": [],
            "audio_description": ""
        }

        for idx, frame in enumerate(frames):
            encoded = base64.standard_b64encode(frame).decode("utf-8")

            message = self.client.messages.create(
                model="claude-opus-4-1",
                max_tokens=1024,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",
                                    "data": encoded
                                }
                            },
                            {
                                "type": "text",
                                "text": """Analyze this video frame and provide:
1. Scene description
2. Any text visible
3. People visible (describe without identifying)
4. Objects present
5. Dominant colors
Return as JSON."""
                            }
                        ]
                    }
                ]
            )

            frame_analysis = self.parse_frame_analysis(message.content[0].text)
            analysis["scenes"].append(frame_analysis.get("scene", ""))
            analysis["detected_text"].extend(frame_analysis.get("text", []))
            analysis["people"].extend(frame_analysis.get("people", []))
            analysis["objects"].extend(frame_analysis.get("objects", []))

        return analysis

    @staticmethod
    def parse_frame_analysis(text: str) -> dict:
        try:
            import json
            return json.loads(text)
        except:
            return {}

async def analyze_with_vision(video_id: str):
    video = await VideoRepository.get_video(video_id)
    if not video:
        logger.error(f"Video {video_id} not found")
        return

    logger.info(f"Analyzing video {video_id} with vision...")

    analyzer = VisionAnalyzer()
    frames = await extract_frames(video["url"], sample_rate=10)
    analysis = await analyzer.analyze_frames(video_id, frames)

    metadata = {
        "analysis": analysis,
        "analyzed_at": "now"
    }
    await MetadataRepository.save_metadata(video_id, metadata)
    logger.info(f"Vision analysis complete for {video_id}")

async def extract_frames(video_url: str, sample_rate: int = 10) -> List[bytes]:
    import cv2
    import numpy as np

    frames = []
    try:
        cap = cv2.VideoCapture(video_url)
        frame_count = 0
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_interval = int(fps * sample_rate) if fps else sample_rate

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % frame_interval == 0:
                _, buffer = cv2.imencode(".jpg", frame)
                frames.append(buffer.tobytes())

            frame_count += 1

        cap.release()
    except Exception as e:
        logger.error(f"Frame extraction error: {e}")

    return frames

async def query_videos(
    month: Optional[str] = None,
    tags: Optional[str] = None,
    duration_min: Optional[int] = None,
    duration_max: Optional[int] = None,
    quality: Optional[str] = None,
    limit: int = 50
):
    filters = {
        "month": month,
        "tags": tags,
        "duration_min": duration_min,
        "duration_max": duration_max,
        "quality": quality
    }
    filters = {k: v for k, v in filters.items() if v is not None}

    videos = await VideoRepository.list_videos(filters, limit)
    return {
        "count": len(videos),
        "videos": videos,
        "filters": filters
    }

async def get_video_details(video_id: str):
    video = await VideoRepository.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    metadata = await MetadataRepository.get_metadata(video_id)

    return {
        "video": video,
        "metadata": metadata
    }

async def reorganize_all():
    logger.info("Reorganizing all videos...")

    videos = await VideoRepository.list_videos(limit=1000)

    for video in videos:
        if not video.get("analyzed"):
            await analyze_with_vision(video["id"])

    logger.info(f"Reorganization complete for {len(videos)} videos")

async def get_smart_collections():
    videos = await VideoRepository.list_videos(limit=1000)

    collections = {
        "by_month": {},
        "by_quality": {},
        "by_source": {}
    }

    for video in videos:
        month = video.get("month")
        if month:
            if month not in collections["by_month"]:
                collections["by_month"][month] = []
            collections["by_month"][month].append(video["id"])

        quality = video.get("quality", "unknown")
        if quality not in collections["by_quality"]:
            collections["by_quality"][quality] = []
        collections["by_quality"][quality].append(video["id"])

        source = video.get("source", "unknown")
        if source not in collections["by_source"]:
            collections["by_source"][source] = []
        collections["by_source"][source].append(video["id"])

    return collections

@router.get("/search")
async def search_videos(q: str):
    return await query_videos(tags=q)

@router.get("/by-month/{month}")
async def videos_by_month(month: str):
    return await query_videos(month=month)

@router.get("/collections")
async def list_collections():
    return await get_smart_collections()
