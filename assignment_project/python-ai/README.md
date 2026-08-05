# PDF Knowledge Base AI Microservice (Render Web Service)

FastAPI microservice responsible for PDF text extraction (`pdfplumber` + `PyPDF`), semantic chunking, Gemini embedding generation, ChromaDB vector indexing, 5-node LangGraph RAG workflow, and Redis Pub/Sub communication.

## 🚀 Render Deployment Guide

### Option 1: Native Python Environment on Render
1. Create a new **Web Service** on [Render Dashboard](https://dashboard.render.com/).
2. Connect your Git repository and set **Root Directory** to `python-ai`.
3. Set **Runtime** to `Python 3`.
4. Configure commands:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
5. In **Environment Variables**, add:
   - `PYTHON_VERSION`: `3.11.9` (Important: pins stable Python release with pre-built binary wheels)
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `REDIS_URL`: Your Upstash Redis URL (`rediss://default:<password>@<host>.upstash.io:6379`)
   - `CHROMA_PATH`: `./chroma_data`

### Option 2: Docker Environment on Render
1. Create a new **Web Service** on Render pointing to the `python-ai` directory.
2. Select **Docker** as the environment. Render will automatically discover `python-ai/Dockerfile`.
3. Add the required environment variables (`GEMINI_API_KEY`, `REDIS_URL`, `CHROMA_PATH`).
4. Render will build the container, bind to dynamic `$PORT`, and run FastAPI with the active Redis subscriber.

## 📡 Redis Pub/Sub Communication Flow

- **Subscribes to**: `ai_request` channel
- **Publishes to**: `ai_response:{requestId}` channel
- No direct HTTP ingress needed for AI execution — it runs continuously via Redis Pub/Sub listener daemon!
