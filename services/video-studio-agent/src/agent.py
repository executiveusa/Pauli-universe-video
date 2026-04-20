from anthropic import Anthropic
from typing import Optional, Dict, Any
import logging
import json
from routers.llm import LLMManager
from routers.videos import query_videos, get_smart_collections
from routers.assets import (
    queue_video_generation,
    queue_intro_generation,
    queue_voice_generation,
    queue_generation
)
from database import JobRepository

logger = logging.getLogger(__name__)

class VideoStudioAgent:
    def __init__(self):
        self.client = Anthropic()
        self.llm = LLMManager()
        self.model = "claude-opus-4-1"
        self.system_prompt = self.build_system_prompt()

    def build_system_prompt(self) -> str:
        return """You are an AI Video Studio Agent for creators. You help manage video content and generate creative assets.

Your capabilities:
1. **Video Management**: Search, organize, and analyze videos from cloud storage (Google Drive, Dropbox, OneDrive)
2. **Video Analysis**: Use vision AI to extract metadata, detect scenes, people, objects, and text
3. **Video Generation**: Create videos from text prompts using SeedDance
4. **Intro Generation**: Generate motion-based intros using cdance
5. **Asset Generation**: Create thumbnails, clips, and captions using Hyperframe
6. **Voice & Avatar**: Add AI voices and avatars using Mercury 2
7. **Export**: Export to Adobe Premiere (EDL/XML) or DaVinci Resolve

When a creator asks something, determine which action they need:
- "Show me videos from March" → Search videos by month
- "Create an intro for my video" → Generate intro with cdance
- "Make a 60-second video about X" → Generate video with SeedDance
- "Add a voice to this video" → Queue voice generation with Mercury 2
- "Give me 10 short clips" → Generate clips with Hyperframe
- "What's in this video?" → Analyze with vision AI
- "Export to Premiere" → Generate EDL/XML for editing software

Always confirm with the user before queuing long-running jobs.
Be conversational and helpful. Ask clarifying questions when needed."""

    async def process_message(self, user_message: str, context: Optional[Dict[str, Any]] = None) -> str:
        messages = [
            {"role": "user", "content": user_message}
        ]

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            system=self.system_prompt,
            messages=messages
        )

        assistant_response = response.content[0].text

        intent = await self.detect_intent(user_message)

        if intent.get("action") == "search_videos":
            videos = await query_videos(
                month=intent.get("month"),
                tags=intent.get("tags"),
                quality=intent.get("quality")
            )
            assistant_response += f"\n\nFound {videos['count']} videos matching your criteria."

        elif intent.get("action") == "generate_intro":
            prompt = intent.get("prompt", user_message)
            duration = intent.get("duration", 5)
            job_id = await queue_intro_generation(prompt, duration)
            assistant_response += f"\n\nIntro generation queued (Job: {job_id}). I'll create a {duration}s intro for you!"

        elif intent.get("action") == "generate_video":
            prompt = intent.get("prompt", user_message)
            seed = intent.get("seed")
            job_id = await queue_video_generation(prompt, seed)
            assistant_response += f"\n\nVideo generation queued (Job: {job_id}). Creating your video now..."

        elif intent.get("action") == "generate_voice":
            video_id = intent.get("video_id")
            text = intent.get("text")
            voice_id = intent.get("voice_id")
            job_id = await queue_voice_generation(video_id, text, voice_id)
            assistant_response += f"\n\nVoice generation queued (Job: {job_id}). Adding voice and avatar..."

        elif intent.get("action") == "list_collections":
            collections = await get_smart_collections()
            assistant_response += f"\n\nAvailable collections:\n{json.dumps(collections, indent=2)}"

        elif intent.get("action") == "analyze_video":
            video_id = intent.get("video_id")
            job_id = await JobRepository.create_job("vision_analysis", video_id)
            assistant_response += f"\n\nAnalysis queued (Job: {job_id}). Analyzing video content..."

        return assistant_response

    async def detect_intent(self, message: str) -> Dict[str, Any]:
        intent_prompt = f"""Analyze this message and extract the creator's intent.
Return a JSON object with:
- action: (search_videos, generate_intro, generate_video, generate_voice, list_collections, analyze_video, unknown)
- month: (if mentioned)
- tags: (if mentioned)
- quality: (if mentioned, e.g., "4K")
- prompt: (for generation tasks)
- duration: (for video/intro generation, default 5)
- seed: (for video generation)
- video_id: (if referencing a specific video)
- text: (for voice generation)
- voice_id: (for voice generation)

Message: "{message}"

Return only valid JSON, no markdown."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=512,
            messages=[
                {"role": "user", "content": intent_prompt}
            ]
        )

        try:
            intent_data = json.loads(response.content[0].text)
            return intent_data
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse intent: {response.content[0].text}")
            return {"action": "unknown"}

class TelegramHandler:
    def __init__(self, bot_token: str):
        self.token = bot_token
        self.agent = VideoStudioAgent()
        self.base_url = f"https://api.telegram.org/bot{bot_token}"

    async def handle_message(self, chat_id: str, message: str) -> str:
        response = await self.agent.process_message(message)
        return response

    async def send_message(self, chat_id: str, text: str):
        import httpx
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{self.base_url}/sendMessage",
                json={"chat_id": chat_id, "text": text}
            )

class WhatsAppHandler:
    def __init__(self, api_token: str):
        self.token = api_token
        self.agent = VideoStudioAgent()
        self.base_url = "https://graph.instagram.com/v18.0"

    async def handle_message(self, phone_number: str, message: str) -> str:
        response = await self.agent.process_message(message)
        return response

    async def send_message(self, phone_number: str, text: str):
        import httpx
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{self.base_url}/messages",
                headers={"Authorization": f"Bearer {self.token}"},
                json={
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": phone_number,
                    "type": "text",
                    "text": {"body": text}
                }
            )
