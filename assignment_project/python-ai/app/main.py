"""
FastAPI Application — Python AI Service
Entry point for the AI microservice.

Starts the Redis Pub/Sub subscriber on startup and exposes a health check endpoint.
"""

import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.redis.pubsub_handler import start_subscriber

# ---- Logging Configuration ----

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)


# ---- Application Lifespan ----

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("Starting Python AI Service...")
    start_subscriber()
    logger.info("AI Service ready — Redis subscriber active")
    yield
    logger.info("Shutting down Python AI Service...")


# ---- FastAPI App ----

app = FastAPI(
    title="PDF Knowledge Base AI Service",
    description="AI microservice for PDF processing, RAG, and question answering",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Routes ----

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "python-ai",
        "version": "1.0.0",
    }
