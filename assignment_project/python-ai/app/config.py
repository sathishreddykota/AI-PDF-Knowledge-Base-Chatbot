"""
Configuration module for the Python AI Service.
Loads and validates environment variables using Pydantic Settings.
"""

from pathlib import Path

from pydantic_settings import BaseSettings


APP_DIR = Path(__file__).resolve().parents[1]
SERVICE_DIR = APP_DIR.parent
PROJECT_ROOT = SERVICE_DIR.parent


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    gemini_api_key: str
    redis_url: str
    chroma_path: str = "./chroma_data"
    mongodb_uri: str = ""

    class Config:
        env_file = (
            PROJECT_ROOT / ".env",
            SERVICE_DIR / ".env",
        )
        case_sensitive = False
        extra = "ignore"


# Singleton settings instance
settings = Settings()
