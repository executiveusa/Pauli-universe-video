from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Optional
import logging
import os
from database import JobRepository
import httpx
import uuid

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/assets", tags=["assets"])

class SeedDanceGenerator:
    def __init__(self):
        self.api_url = "https://api-inference.huggingface.co/models/ByteDance/SeedDance"
        self.hf_token = os.getenv("HUGGINGFACE_API_KEY")

    async def generate_video(self, prompt: str, seed: Optional[int] = None) -> dict:
        headers = {"Authorization": f"Bearer {self.hf_token}"}

        payload = {
            "inputs": prompt,
            "parameters": {
                "seed": seed or 42,
                "steps": 50,
                "guidance_scale": 7.5
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(self.api_url, json=payload, headers=headers)

            if response.status_code == 200:
                return {
                    "success": True,
                    "video_url": response.json().get("video_url")
                }
            else:
                return {
                    "success": False,
                    "error": response.text
                }

class CdanceGenerator:
    def __init__(self):
        self.api_url = "https://api-inference.huggingface.co/models/motion-diffusion/cdance"
        self.hf_token = os.getenv("HUGGINGFACE_API_KEY")

    async def generate_dance(self, prompt: str, duration: int = 5) -> dict:
        headers = {"Authorization": f"Bearer {self.hf_token}"}

        payload = {
            "inputs": prompt,
            "parameters": {
                "duration": duration,
                "fps": 30
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(self.api_url, json=payload, headers=headers)

            if response.status_code == 200:
                return {
                    "success": True,
                    "video_url": response.json().get("video_url")
                }
            else:
                return {
                    "success": False,
                    "error": response.text
                }

class HyperframeGenerator:
    def __init__(self):
        self.api_url = "https://hyperframe-api.example.com"
        self.api_key = os.getenv("HYPERFRAME_API_KEY")

    async def generate_thumbnail(self, video_url: str) -> dict:
        headers = {"Authorization": f"Bearer {self.api_key}"}

        payload = {
            "video_url": video_url,
            "type": "thumbnail"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.api_url}/generate", json=payload, headers=headers)

            if response.status_code == 200:
                return response.json()
            else:
                return {"success": False, "error": response.text}

    async def generate_captions(self, video_url: str) -> dict:
        headers = {"Authorization": f"Bearer {self.api_key}"}

        payload = {
            "video_url": video_url,
            "type": "captions"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.api_url}/generate", json=payload, headers=headers)

            if response.status_code == 200:
                return response.json()
            else:
                return {"success": False, "error": response.text}

    async def generate_clips(self, video_url: str, count: int = 10) -> dict:
        headers = {"Authorization": f"Bearer {self.api_key}"}

        payload = {
            "video_url": video_url,
            "type": "clips",
            "count": count
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.api_url}/generate", json=payload, headers=headers)

            if response.status_code == 200:
                return response.json()
            else:
                return {"success": False, "error": response.text}

class Mercury2VoiceGenerator:
    def __init__(self):
        self.api_url = "https://api.mercurylabs.ai/v1"
        self.api_key = os.getenv("MERCURY_API_KEY")

    async def generate_voice(self, text: str, voice_id: Optional[str] = None) -> dict:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "text": text,
            "voice_id": voice_id or "default",
            "speed": 1.0
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/voice/generate",
                json=payload,
                headers=headers
            )

            if response.status_code == 200:
                return response.json()
            else:
                return {"success": False, "error": response.text}

    async def add_avatar(self, video_url: str, voice_url: str) -> dict:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "video_url": video_url,
            "voice_url": voice_url
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/avatar/compose",
                json=payload,
                headers=headers
            )

            if response.status_code == 200:
                return response.json()
            else:
                return {"success": False, "error": response.text}

async def queue_generation(video_id: str, asset_type: str, params: dict):
    job = await JobRepository.create_job("asset_generation", video_id, {
        "asset_type": asset_type,
        "params": params
    })
    return job["id"]

async def queue_intro_generation(prompt: str, duration: int):
    job = await JobRepository.create_job("intro_generation", None, {
        "prompt": prompt,
        "duration": duration
    })
    return job["id"]

async def queue_video_generation(prompt: str, seed: Optional[int]):
    job = await JobRepository.create_job("seedance_generation", None, {
        "prompt": prompt,
        "seed": seed
    })
    return job["id"]

async def queue_voice_generation(video_id: str, text: str, voice_id: Optional[str]):
    job = await JobRepository.create_job("mercury2_voice", video_id, {
        "text": text,
        "voice_id": voice_id
    })
    return job["id"]

async def process_generation(job_id: str):
    job = await JobRepository.get_job(job_id)
    if not job:
        return

    try:
        asset_type = job["params"].get("asset_type")
        video_id = job["video_id"]

        if asset_type == "thumbnail":
            await JobRepository.update_job(job_id, "processing")
            hyperframe = HyperframeGenerator()
            result = await hyperframe.generate_thumbnail(f"s3://pauli-videos/{video_id}")
            await JobRepository.update_job(job_id, "completed", result)

        elif asset_type == "captions":
            await JobRepository.update_job(job_id, "processing")
            hyperframe = HyperframeGenerator()
            result = await hyperframe.generate_captions(f"s3://pauli-videos/{video_id}")
            await JobRepository.update_job(job_id, "completed", result)

        elif asset_type == "clips":
            await JobRepository.update_job(job_id, "processing")
            hyperframe = HyperframeGenerator()
            result = await hyperframe.generate_clips(f"s3://pauli-videos/{video_id}", 10)
            await JobRepository.update_job(job_id, "completed", result)

    except Exception as e:
        logger.error(f"Asset generation error: {e}")
        await JobRepository.update_job(job_id, "failed", {"error": str(e)})

async def process_intro(job_id: str):
    job = await JobRepository.get_job(job_id)
    if not job:
        return

    try:
        prompt = job["params"].get("prompt")
        duration = job["params"].get("duration")

        await JobRepository.update_job(job_id, "processing")

        cdance = CdanceGenerator()
        result = await cdance.generate_dance(prompt, duration)

        if result.get("success"):
            await JobRepository.update_job(job_id, "completed", result)
        else:
            await JobRepository.update_job(job_id, "failed", result)

    except Exception as e:
        logger.error(f"Intro generation error: {e}")
        await JobRepository.update_job(job_id, "failed", {"error": str(e)})

async def process_seedance_video(job_id: str):
    job = await JobRepository.get_job(job_id)
    if not job:
        return

    try:
        prompt = job["params"].get("prompt")
        seed = job["params"].get("seed")

        await JobRepository.update_job(job_id, "processing")

        generator = SeedDanceGenerator()
        result = await generator.generate_video(prompt, seed)

        if result.get("success"):
            await JobRepository.update_job(job_id, "completed", result)
        else:
            await JobRepository.update_job(job_id, "failed", result)

    except Exception as e:
        logger.error(f"SeedDance generation error: {e}")
        await JobRepository.update_job(job_id, "failed", {"error": str(e)})

async def process_mercury2_voice(job_id: str):
    job = await JobRepository.get_job(job_id)
    if not job:
        return

    try:
        text = job["params"].get("text")
        voice_id = job["params"].get("voice_id")
        video_id = job["video_id"]

        await JobRepository.update_job(job_id, "processing")

        mercury = Mercury2VoiceGenerator()
        voice_result = await mercury.generate_voice(text, voice_id)

        if voice_result.get("success"):
            avatar_result = await mercury.add_avatar(
                f"s3://pauli-videos/{video_id}",
                voice_result.get("voice_url")
            )
            await JobRepository.update_job(job_id, "completed", avatar_result)
        else:
            await JobRepository.update_job(job_id, "failed", voice_result)

    except Exception as e:
        logger.error(f"Mercury2 voice generation error: {e}")
        await JobRepository.update_job(job_id, "failed", {"error": str(e)})

async def get_job_status(job_id: str):
    job = await JobRepository.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job["id"],
        "status": job["status"],
        "type": job["type"],
        "result": job.get("result")
    }

@router.post("/generate/intro")
async def create_intro(prompt: str, duration: int = 5, background_tasks: BackgroundTasks):
    job_id = await queue_intro_generation(prompt, duration)
    background_tasks.add_task(process_intro, job_id)
    return {"job_id": job_id, "status": "queued"}

@router.post("/generate/video")
async def create_video(prompt: str, seed: Optional[int] = None, background_tasks: BackgroundTasks):
    job_id = await queue_video_generation(prompt, seed)
    background_tasks.add_task(process_seedance_video, job_id)
    return {"job_id": job_id, "status": "queued"}

@router.post("/generate/voice")
async def add_voice(video_id: str, text: str, voice_id: Optional[str] = None, background_tasks: BackgroundTasks):
    job_id = await queue_voice_generation(video_id, text, voice_id)
    background_tasks.add_task(process_mercury2_voice, job_id)
    return {"job_id": job_id, "status": "queued"}
