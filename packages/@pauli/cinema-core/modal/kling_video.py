import modal
import base64
import json
from typing import Optional
from datetime import datetime

app = modal.App("pauli-cinema-kling")

image = (
    modal.Image.debian_slim()
    .pip_install(
        "requests==2.31.0",
        "pillow==10.1.0",
    )
)


class KlingVideoGenerator:
    """Generate videos using Kling 3.0 API (fallback provider)."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_url = "https://api.klingai.com/v1"
        self.model = "kling-3.0"

    def generate_video(
        self,
        keyframe_base64: str,
        prompt: str,
        duration_sec: int = 20,
    ) -> bytes:
        """Generate video from keyframe using Kling 3.0."""
        import requests

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "image": keyframe_base64,
            "prompt": prompt,
            "duration": duration_sec,
            "format": "mp4",
        }

        response = requests.post(
            f"{self.api_url}/videos/generate",
            json=payload,
            headers=headers,
            timeout=600,
        )

        if response.status_code != 200:
            raise Exception(
                f"Kling API error: {response.status_code} - {response.text}"
            )

        return response.content


@app.function(
    image=image,
    gpu="A40",
    timeout=600,
    retries=modal.Retries(max_retries=2),
)
def generate_kling_video(
    keyframe_base64: str,
    prompt: str,
    duration_sec: int = 20,
) -> dict:
    """
    Generate video using Kling 3.0 (fallback provider).

    Args:
        keyframe_base64: Base64-encoded keyframe image
        prompt: Video description prompt
        duration_sec: Video duration in seconds (5-30)

    Returns:
        dict with video bytes (base64), metadata, and cost
    """
    api_key = modal.get_secret("kling-api-key").get("key")
    generator = KlingVideoGenerator(api_key)

    start_time = datetime.utcnow()

    try:
        if not keyframe_base64 or len(keyframe_base64) < 100:
            raise ValueError("Invalid keyframe data")

        if duration_sec < 5 or duration_sec > 30:
            raise ValueError("Duration must be 5-30 seconds")

        video_bytes = generator.generate_video(
            keyframe_base64=keyframe_base64,
            prompt=prompt,
            duration_sec=duration_sec,
        )

        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()

        # Cost: Kling A40 ~$0.50/hour
        cost = (duration / 3600) * 0.50

        video_base64 = base64.b64encode(video_bytes).decode("utf-8")

        metadata = {
            "provider": "kling-3.0",
            "prompt": prompt,
            "duration_sec": duration_sec,
            "generation_time_sec": round(duration, 2),
            "video_size_bytes": len(video_bytes),
            "generated_at": start_time.isoformat(),
        }

        return {
            "success": True,
            "video_base64": video_base64,
            "video_size": len(video_bytes),
            "metadata": metadata,
            "cost": round(cost, 4),
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "cost": 0.0,
        }
