import modal
import base64
import hashlib
import json
from typing import Optional
from datetime import datetime

# Define the Modal app
app = modal.App("pauli-cinema-flux")

# Define GPU image with all required packages
image = (
    modal.Image.debian_slim()
    .pip_install(
        "torch==2.1.0",
        "diffusers==0.24.0",
        "transformers==4.36.0",
        "pillow==10.1.0",
        "numpy==1.24.3",
    )
    .run_commands(
        "apt-get update && apt-get install -y libcuda-11.8-runtime"
    )
)


class FluxKeyframeGenerator:
    """Generate cinematic keyframes using FLUX.2 model on Modal GPU."""

    def __init__(self):
        self.model_id = "black-forest-labs/FLUX.1-dev"
        self.device = "cuda"
        self.dtype = "torch.float16"
        self.pipeline = None

    def load_model(self):
        """Load FLUX model on first invocation."""
        import torch
        from diffusers import FluxPipeline

        if self.pipeline is None:
            self.pipeline = FluxPipeline.from_pretrained(
                self.model_id,
                torch_dtype=torch.float16,
            ).to(self.device)

    def generate_image(
        self,
        prompt: str,
        height: int = 768,
        width: int = 768,
        num_inference_steps: int = 25,
        guidance_scale: float = 7.5,
        seed: Optional[int] = None,
    ) -> bytes:
        """Generate single cinematic keyframe."""
        import torch

        self.load_model()

        # Ensure reproducibility with seed
        if seed is not None:
            generator = torch.Generator(device=self.device).manual_seed(seed)
        else:
            generator = None

        # Generate image
        with torch.no_grad():
            image = self.pipeline(
                prompt=prompt,
                height=height,
                width=width,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                generator=generator,
            ).images[0]

        # Convert PIL image to PNG bytes
        import io

        buffer = io.BytesIO()
        image.save(buffer, format="PNG", quality=95)
        buffer.seek(0)
        return buffer.getvalue()

    def enhance_prompt(self, prompt: str) -> str:
        """Add cinematic quality descriptors to prompt."""
        cinematic_style = (
            "cinematic, professional cinematography, high quality, "
            "dramatic lighting, 4K, detailed, masterpiece, "
            "color graded, cinematic depth of field"
        )
        return f"{prompt}, {cinematic_style}"


def estimate_tokens(prompt: str) -> int:
    """Estimate token count for prompt (roughly)."""
    return len(prompt.split()) * 1.3


@app.function(
    image=image,
    gpu="A40",
    timeout=300,
    retries=modal.Retries(max_retries=2, backoff_coefficient=2.0),
)
def generate_flux_keyframe(
    prompt: str,
    seed: Optional[int] = None,
    height: int = 768,
    width: int = 768,
) -> dict:
    """
    Generate a single FLUX.2 keyframe on Modal GPU.

    Args:
        prompt: Text description of scene
        seed: Random seed for reproducibility
        height: Image height (default 768)
        width: Image width (default 768)

    Returns:
        dict with:
            - image_bytes: PNG image data (base64 encoded)
            - metadata: generation metadata
            - cost: estimated cost in dollars
    """
    start_time = datetime.utcnow()

    try:
        # Enhance prompt for better cinematic results
        generator = FluxKeyframeGenerator()
        enhanced_prompt = generator.enhance_prompt(prompt)

        # Generate image
        image_bytes = generator.generate_image(
            prompt=enhanced_prompt,
            height=height,
            width=width,
            seed=seed,
            num_inference_steps=25,
            guidance_scale=7.5,
        )

        end_time = datetime.utcnow()
        duration_sec = (end_time - start_time).total_seconds()

        # Calculate cost: A40 GPU costs ~$0.5/hour
        cost = (duration_sec / 3600) * 0.5

        # Encode image to base64 for JSON response
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

        # Create metadata
        metadata = {
            "model": "FLUX.1-dev",
            "prompt": prompt,
            "enhanced_prompt": enhanced_prompt,
            "seed": seed,
            "height": height,
            "width": width,
            "duration_sec": duration_sec,
            "estimated_tokens": int(estimate_tokens(prompt)),
            "generated_at": start_time.isoformat(),
            "image_hash": hashlib.sha256(image_bytes).hexdigest()[:16],
        }

        return {
            "success": True,
            "image_base64": image_base64,
            "image_size": len(image_bytes),
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
    gpu="A40",
    timeout=600,
)
def generate_flux_batch(
    prompts: list[str],
    seeds: Optional[list[int]] = None,
) -> dict:
    """
    Generate multiple FLUX.2 keyframes efficiently.

    Args:
        prompts: List of text descriptions
        seeds: List of seeds (default: auto-generate)

    Returns:
        dict with list of results and total cost
    """
    if seeds is None:
        seeds = list(range(len(prompts)))

    results = []
    total_cost = 0.0

    generator = FluxKeyframeGenerator()

    for prompt, seed in zip(prompts, seeds):
        try:
            enhanced_prompt = generator.enhance_prompt(prompt)
            image_bytes = generator.generate_image(
                prompt=enhanced_prompt,
                seed=seed,
            )

            # Estimate cost
            cost = 0.05  # Rough estimate per image

            results.append({
                "success": True,
                "image_base64": base64.b64encode(image_bytes).decode("utf-8"),
                "prompt": prompt,
                "seed": seed,
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
