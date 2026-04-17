import modal
import base64
import json
from typing import Optional
from datetime import datetime

app = modal.App("pauli-cinema-seedance")

image = (
    modal.Image.debian_slim()
    .pip_install(
        "requests==2.31.0",
        "pillow==10.1.0",
        "numpy==1.24.3",
    )
)


class SeedanceVideoGenerator:
    """Generate videos using Seedance 2.0 API (primary provider)."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_url = "https://api.seedance.ai/v2"
        self.model = "seedance-2.0"

    def generate_video(
        self,
        keyframe_base64: str,
        prompt: str,
        motion_intensity: int = 5,
        duration_sec: int = 20,
    ) -> bytes:
        """Generate video from keyframe using Seedance 2.0."""
        import requests

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "keyframe": keyframe_base64,
            "prompt": prompt,
            "motion_intensity": motion_intensity,
            "duration_seconds": duration_sec,
            "output_format": "mp4",
            "quality": "high",
        }

        # Call Seedance API
        response = requests.post(
            f"{self.api_url}/generate",
            json=payload,
            headers=headers,
            timeout=600,
        )

        if response.status_code != 200:
            raise Exception(
                f"Seedance API error: {response.status_code} - {response.text}"
            )

        # Response is video bytes
        return response.content

    def check_status(self, job_id: str) -> dict:
        """Check generation job status."""
        import requests

        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }

        response = requests.get(
            f"{self.api_url}/jobs/{job_id}",
            headers=headers,
            timeout=30,
        )

        if response.status_code != 200:
            raise Exception(f"Status check failed: {response.status_code}")

        return response.json()


@app.function(
    image=image,
    gpu="A100",
    timeout=900,
    retries=modal.Retries(max_retries=2),
)
def generate_seedance_video(
    keyframe_base64: str,
    prompt: str,
    motion_intensity: int = 5,
    duration_sec: int = 20,
) -> dict:
    """
    Generate video using Seedance 2.0 (primary provider).

    Args:
        keyframe_base64: Base64-encoded keyframe image
        prompt: Video description prompt
        motion_intensity: Motion intensity (1-10)
        duration_sec: Video duration in seconds (5-30)

    Returns:
        dict with video bytes (base64), metadata, and cost
    """
    api_key = modal.get_secret("seedance-api-key").get("key")
    generator = SeedanceVideoGenerator(api_key)

    start_time = datetime.utcnow()

    try:
        # Validate inputs
        if not keyframe_base64 or len(keyframe_base64) < 100:
            raise ValueError("Invalid keyframe data")

        if motion_intensity < 1 or motion_intensity > 10:
            raise ValueError("Motion intensity must be 1-10")

        if duration_sec < 5 or duration_sec > 30:
            raise ValueError("Duration must be 5-30 seconds")

        # Generate video
        video_bytes = generator.generate_video(
            keyframe_base64=keyframe_base64,
            prompt=prompt,
            motion_intensity=motion_intensity,
            duration_sec=duration_sec,
        )

        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()

        # Cost calculation: Seedance A100 ~$0.80/hour
        cost = (duration / 3600) * 0.80

        # Encode video to base64
        video_base64 = base64.b64encode(video_bytes).decode("utf-8")

        metadata = {
            "provider": "seedance-2.0",
            "prompt": prompt,
            "motion_intensity": motion_intensity,
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


@app.function(
    image=image,
    gpu="A100",
    timeout=1800,
)
def generate_seedance_batch(
    keyframes_base64: list[str],
    prompts: list[str],
    motion_intensities: Optional[list[int]] = None,
) -> dict:
    """Generate multiple videos with Seedance 2.0."""
    if motion_intensities is None:
        motion_intensities = [5] * len(keyframes_base64)

    api_key = modal.get_secret("seedance-api-key").get("key")
    generator = SeedanceVideoGenerator(api_key)

    results = []
    total_cost = 0.0

    for keyframe, prompt, intensity in zip(
        keyframes_base64, prompts, motion_intensities
    ):
        try:
            video_bytes = generator.generate_video(
                keyframe_base64=keyframe,
                prompt=prompt,
                motion_intensity=intensity,
                duration_sec=20,
            )

            cost = 0.15  # Rough estimate

            results.append({
                "success": True,
                "video_base64": base64.b64encode(video_bytes).decode("utf-8"),
                "prompt": prompt,
                "cost": cost,
            })

            total_cost += cost

        except Exception as e:
            results.append({
                "success": False,
                "prompt": prompt,
                "error": str(e),
            })

    return {
        "results": results,
        "total_cost": round(total_cost, 4),
        "count": len(results),
    }
