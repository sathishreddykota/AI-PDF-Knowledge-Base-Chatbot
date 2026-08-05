---
title: PDF Knowledge Base AI Microservice
emoji: 🧠
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# PDF Knowledge Base AI Microservice (Hugging Face Spaces)

FastAPI microservice responsible for PDF text extraction (`pdfplumber` + `PyPDF`), semantic chunking, Gemini embedding generation, ChromaDB vector indexing, 5-node LangGraph RAG workflow, and Redis Pub/Sub communication.

## 🚀 Hugging Face Spaces Deployment Guide

1. Create a new Space on [Hugging Face Spaces](https://huggingface.co/new-space).
2. Select **Docker** as the Space SDK (Blank / Docker).
3. Upload all contents of the `python-ai/` directory to your Space repository.
4. In your Space's **Settings -> Secret variables**, add:
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `REDIS_URL`: Your Upstash Redis URL (`rediss://default:<password>@<host>.upstash.io:6379`)
   - `CHROMA_PATH`: `./chroma_data`
5. The Space will automatically build the Docker container, start FastAPI on port `7860`, and connect to the Redis Pub/Sub channel (`ai_request`).

## 📡 Redis Pub/Sub Communication Flow

- **Subscribes to**: `ai_request` channel
- **Publishes to**: `ai_response:{requestId}` channel
- No direct HTTP ingress needed for AI execution — it runs continuously via Redis Pub/Sub listener!
