import modal
import base64
import json
from typing import Optional
from datetime import datetime

app = modal.App("pauli-cinema-infinity")

image = (
    modal.Image.debian_slim()
    .pip_install(
        "requests==2.31.0",
        "pillow==10.1.0",
    )
)


class StableVideoInfinityGenerator:
    """Generate long-form videos using Stable Video Infinity."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_url = "https://api.stability.ai/v2beta"

    def generate_long_video(
        self,
        keyframe_base64: str,
        prompt: str,
        duration_sec: int = 60,
        segment_duration: int = 24,
    ) -> bytes:
        """Generate long-form video by segmenting and blending."""
        import requests

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        # Calculate segments
        num_segments = (duration_sec + segment_duration - 1) // segment_duration

        segment_videos = []

        for i in range(num_segments):
            payload = {
                "image": keyframe_base64,
                "prompt": prompt,
                "duration_seconds": min(segment_duration, duration_sec - i * segment_duration),
                "mode": "infinite" if i > 0 else "standard",
            }

            response = requests.post(
                f"{self.api_url}/image-to-video",
                json=payload,
                headers=headers,
                timeout=600,
            )

            if response.status_code != 200:
                raise Exception(f"Generation failed: {response.status_code}")

            segment_videos.append(response.content)

            # Use last frame of segment as keyframe for next segment
            # In production, extract frame using FFmpeg

        # Concatenate segments (simplified - would blend in production)
        return b"".join(segment_videos)


@app.function(
    image=image,
    gpu="A100",
    timeout=1800,
)
def generate_infinite_video(
    keyframe_base64: str,
    prompt: str,
    duration_sec: int = 60,
) -> dict:
    """
    Generate long-form video (60+ seconds) using Stable Video Infinity.

    Args:
        keyframe_base64: Base64-encoded initial keyframe
        prompt: Video description
        duration_sec: Total duration (5-300 seconds)

    Returns:
        dict with video bytes, metadata, and cost
    """
    api_key = modal.get_secret("stability-api-key").get("key")
    generator = StableVideoInfinityGenerator(api_key)

    start_time = datetime.utcnow()

    try:
        if duration_sec < 5 or duration_sec > 300:
            raise ValueError("Duration must be 5-300 seconds")

        video_bytes = generator.generate_long_video(
            keyframe_base64=keyframe_base64,
            prompt=prompt,
            duration_sec=duration_sec,
        )

        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()

        # Cost: A100 ~$1.00/hour
        cost = (duration / 3600) * 1.00

        video_base64 = base64.b64encode(video_bytes).decode("utf-8")

        metadata = {
            "provider": "stable-video-infinity",
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
