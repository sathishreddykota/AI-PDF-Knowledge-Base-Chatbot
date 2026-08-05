"""
Configuration module for the Python AI Service.
Loads and validates environment variables using Pydantic Settings.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    gemini_api_key: str
    redis_url: str
    chroma_path: str = "./chroma_data"
    mongodb_uri: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False


# Singleton settings instance
settings = Settings()
