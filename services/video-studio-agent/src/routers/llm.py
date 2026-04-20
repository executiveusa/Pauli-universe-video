from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any
import logging
import os
from litellm import completion
from database import IntegrationRepository
import httpx

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/llm", tags=["llm"])

class LLMManager:
    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "claude")
        self.model = os.getenv("LLM_MODEL", "claude-opus-4-1")
        self.api_key = os.getenv("LLM_API_KEY")

    async def chat(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        messages = [
            {"role": "user", "content": message}
        ]

        try:
            response = completion(
                model=f"{self.provider}/{self.model}",
                messages=messages,
                api_key=self.api_key,
                temperature=0.7,
                max_tokens=1024
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"LLM error: {e}")
            raise

    async def set_provider(self, provider: str, config: Dict[str, Any]):
        self.provider = provider
        self.model = config.get("model", self.model)
        self.api_key = config.get("api_key", self.api_key)

        await IntegrationRepository.save_integration("llm", {
            "provider": provider,
            "model": self.model,
            "api_key": "***"
        })

        logger.info(f"LLM provider changed to {provider}/{self.model}")

class ChatGPTOAuth:
    def __init__(self):
        self.client_id = os.getenv("OPENAI_CLIENT_ID")
        self.client_secret = os.getenv("OPENAI_CLIENT_SECRET")
        self.redirect_uri = os.getenv("OPENAI_REDIRECT_URI", "http://localhost:8000/llm/callback")

    def get_auth_url(self) -> str:
        return (
            f"https://auth.openai.com/authorize?"
            f"client_id={self.client_id}&"
            f"redirect_uri={self.redirect_uri}&"
            f"response_type=code&"
            f"scope=chat.write"
        )

    async def exchange_code(self, code: str) -> Dict[str, str]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://auth.openai.com/token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": self.redirect_uri
                }
            )

            if response.status_code == 200:
                token_data = response.json()
                return {
                    "access_token": token_data.get("access_token"),
                    "refresh_token": token_data.get("refresh_token")
                }
            else:
                raise HTTPException(status_code=400, detail="OAuth exchange failed")

async def configure_provider(provider: str, config: Dict[str, Any]):
    manager = LLMManager()
    await manager.set_provider(provider, config)
    return {
        "status": "configured",
        "provider": provider,
        "model": config.get("model")
    }

async def oauth_chatgpt_sync(auth_code: str):
    oauth = ChatGPTOAuth()
    tokens = await oauth.exchange_code(auth_code)

    await IntegrationRepository.save_integration("chatgpt_oauth", {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"]
    })

    manager = LLMManager()
    await manager.set_provider("openai", {
        "model": "gpt-4",
        "api_key": tokens["access_token"]
    })

    return {
        "status": "synced",
        "provider": "openai_chatgpt",
        "model": "gpt-4"
    }

@router.post("/provider/set")
async def set_llm_provider(provider: str, model: str, api_key: str):
    return await configure_provider(provider, {
        "model": model,
        "api_key": api_key
    })

@router.post("/provider/litellm")
async def set_litellm_provider(provider: str, model: str, api_key: str):
    return await configure_provider(provider, {
        "model": model,
        "api_key": api_key
    })

@router.get("/oauth/chatgpt/url")
async def get_chatgpt_auth_url():
    oauth = ChatGPTOAuth()
    return {
        "auth_url": oauth.get_auth_url()
    }

@router.post("/oauth/chatgpt/callback")
async def handle_chatgpt_callback(code: str):
    return await oauth_chatgpt_sync(code)

@router.get("/provider/current")
async def get_current_provider():
    manager = LLMManager()
    return {
        "provider": manager.provider,
        "model": manager.model
    }

@router.post("/chat")
async def llm_chat(message: str, context: Optional[Dict[str, Any]] = None):
    manager = LLMManager()
    response = await manager.chat(message, context)
    return {
        "message": message,
        "response": response,
        "provider": manager.provider,
        "model": manager.model
    }

@router.get("/providers/supported")
async def list_supported_providers():
    return {
        "providers": [
            "anthropic",
            "openai",
            "google",
            "cohere",
            "huggingface",
            "azure",
            "mistral",
            "custom"
        ],
        "models_by_provider": {
            "anthropic": ["claude-opus-4-1", "claude-sonnet-4"],
            "openai": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
            "google": ["gemini-pro", "gemini-1.5-flash"],
            "mistral": ["mistral-large", "mistral-medium"],
            "huggingface": ["meta-llama/Llama-2-70b-hf"]
        }
    }
