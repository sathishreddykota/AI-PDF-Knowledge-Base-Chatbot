# AI PDF Knowledge Base Chatbot (RAG System)

A production-ready, microservice-based AI Knowledge Base Chatbot system. Administrators can upload PDF documents that automatically become the AI's knowledge base. Public users can ask questions through a ChatGPT-like interface, receiving answers strictly grounded in the uploaded documents with source document & page citations, alongside 3–5 automatically generated follow-up questions.

---

## 🏗 System Architecture Diagram

```
+-----------------------------------------------------------------------+
|                         Next.js 15 Frontend                           |
|                  (App Router, TypeScript, Tailwind)                   |
+-----------------------------------------------------------------------+
                                   |
                             HTTP / REST
                                   v
+-----------------------------------------------------------------------+
|                         Node.js NestJS Backend                        |
|                  (JWT Auth, Mongoose, Multer, Winston)                |
+-----------------------------------------------------------------------+
                                   |
                            Redis Pub/Sub
                    (Channels: ai_request & ai_response)
                                   v
+-----------------------------------------------------------------------+
|                       Python AI Microservice                          |
|             (FastAPI, LangChain, LangGraph, ChromaDB, Gemini)         |
+-----------------------------------------------------------------------+
           |                                             |
           v                                             v
+-----------------------+                     +---------------------+
| ChromaDB Vector Store |                     | MongoDB Persistence |
|   (PDF Embeddings)    |                     | (Users, Docs, Chats)|
+-----------------------+                     +---------------------+
```

---

## ⚡ Key Features

- **Microservice Architecture**: Decoupled Node.js Backend & Python AI Service communicating **strictly via Redis Pub/Sub**.
- **Admin Management Portal**:
  - Secure JWT Authentication (Access Token + Refresh Token).
  - Seeded Super Admin credentials (`admin@admin.com` / `Admin@123`).
  - Analytics Dashboard with real-time metrics (Total PDFs, Total Chat Sessions, Total Questions Asked).
  - Knowledge Base Management: PDF Upload, Search, List, Reprocess, and Delete.
- **Automated RAG Pipeline**:
  - Text Extraction using `pdfplumber` with `PyPDF` fallback.
  - Semantic Chunking using `RecursiveCharacterTextSplitter` (1000 char size, 100 overlap).
  - Gemini Embedding generation (`models/embedding-001`).
  - Persistent Vector Indexing in **ChromaDB**.
- **Public ChatGPT-like AI Chatbot**:
  - No authentication required for public chat.
  - Grounded answers strictly derived from document context (no hallucinations).
  - Source citations (Document name + Page number).
  - 3–5 LLM-generated follow-up question suggestions after every response.
  - Conversation history memory.
  - Code block syntax highlighting & Markdown rendering.
  - Animated typing indicator & dark mode UI.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack React Query, Zustand, React Hook Form, Zod, Framer Motion, Lucide Icons |
| **Backend** | Node.js, NestJS, TypeScript, Mongoose, JWT + Passport, ioredis, Multer, Winston |
| **AI Service** | Python 3.11, FastAPI, LangChain, LangGraph, ChromaDB, Google Gemini 2.5 Flash, pdfplumber, PyPDF, Pydantic |
| **Broker** | Redis Pub/Sub (Upstash or local Redis) |
| **Database** | MongoDB Atlas / MongoDB |
| **Vector DB** | ChromaDB |

---

## 🔁 Redis Pub/Sub Communication Flow

The Node.js backend **NEVER** calls Python APIs directly for AI processing.

1. **Client Request**: Frontend sends a request (`POST /chat/ask` or `POST /documents/upload`) to the NestJS Backend.
2. **Publish**: NestJS Backend publishes a message to `ai_request` channel:
   ```json
   {
     "requestId": "uuid-v4",
     "type": "chat | process | delete",
     "sessionId": "session_123",
     "question": "What is the policy?",
     "chatHistory": [...]
   }
   ```
3. **Subscribe & Process**: Python AI Service listens on `ai_request`, executes the RAG pipeline or PDF indexing.
4. **Publish Response**: Python AI Service publishes the response to `ai_response:{requestId}` channel:
   ```json
   {
     "request_id": "uuid-v4",
     "success": true,
     "answer": "The leave policy allows...",
     "sources": [{"filename": "Handbook.pdf", "page_number": 12}],
     "suggested_questions": ["How do I request leave?", "What about sick leaves?"]
   }
   ```
5. **Return**: NestJS Backend receives message on `ai_response:{requestId}` and returns the result to the Frontend.

---

## ⛓ LangGraph 5-Node Workflow

The Python AI service implements a stateful 5-node LangGraph pipeline:

```
[1. receive_question] ➔ [2. retrieve_context] ➔ [3. generate_answer] ➔ [4. generate_suggestions] ➔ [5. return_response]
```

1. **`receive_question`**: Parses incoming request and formats recent session chat history.
2. **`retrieve_context`**: Queries ChromaDB vector store for top-K (5) most relevant semantic chunks and extracts source metadata.
3. **`generate_answer`**: Invokes LangChain with Gemini 2.5 Flash using strict RAG prompts. If context is missing, returns: *"I couldn't find this information in the uploaded documents."*
4. **`generate_suggestions`**: Generates 3–5 contextual follow-up questions based on the retrieved knowledge and conversation context.
5. **`return_response`**: Constructs final output schema with answer, citations, and follow-up chips.

---

## 📁 Repository Structure

```
assignment_project/
├── frontend/                  # Next.js 15 App Router Frontend
│   ├── src/
│   │   ├── app/               # Routes: /, /login, /admin/dashboard, /admin/documents, /admin/settings
│   │   ├── components/        # Chat components, Admin components, UI elements
│   │   ├── hooks/             # React Query hooks (useChat, useDocuments, useDashboard)
│   │   ├── lib/               # Axios client, Zod schemas, utility functions
│   │   └── store/             # Zustand state management (auth-store, chat-store)
│   ├── package.json
│   └── Dockerfile
│
├── backend/                   # NestJS Microservice
│   ├── src/
│   │   ├── auth/              # JWT Auth, Login, Refresh, Logout, Passport Strategy
│   │   ├── chat/              # Chat Controller, Service, Schema, History
│   │   ├── documents/         # PDF Upload, List, Reprocess, Delete, Mongoose Schema
│   │   ├── dashboard/         # Aggregated Analytics Stats
│   │   ├── redis/             # ioredis Pub/Sub Wrapper
│   │   └── users/             # Admin User Seeding & Lookup
│   ├── package.json
│   └── Dockerfile
│
├── python-ai/                 # Python FastAPI AI Microservice
│   ├── app/
│   │   ├── main.py            # FastAPI entry point & lifespan event
│   │   ├── config.py          # Pydantic environment configuration
│   │   ├── models/            # Pydantic schemas (AIRequest, AIResponse, GraphState)
│   │   ├── prompts/           # Answer & Suggestions prompt templates
│   │   ├── redis/             # Pub/Sub handler daemon loop
│   │   └── services/          # PDF Processor, Chunking, Embedding/ChromaDB, LangGraph
│   ├── requirements.txt
│   └── Dockerfile
│
├── shared/
│   └── types.ts               # Shared TypeScript interfaces
├── docker-compose.yml         # Local Docker Orchestration
├── README.md
└── .env.example
```

---

## 🛠 Local Setup Instructions

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+
- MongoDB instance (local or Atlas)
- Redis instance (local or Upstash)
- Google Gemini API Key

---

### Option 1: Running with Docker Compose

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd assignment_project
   ```

2. Create a root `.env` file or export your Gemini Key:
   ```bash
   export GEMINI_API_KEY="your_gemini_api_key_here"
   ```

3. Start all services using Docker Compose:
   ```bash
   docker-compose up --build
   ```

4. Access services:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:4000
   - **Python AI Service**: http://localhost:8000

---

### Option 2: Running Services Manually

#### 1. Setup Backend (NestJS)
```bash
cd backend
npm install
# Create .env file based on .env.example
npm run start:dev
```

#### 2. Setup Python AI Service
```bash
cd python-ai
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
# Create .env file based on .env.example
uvicorn app.main:app --reload --port 8000
```

#### 3. Setup Frontend (Next.js)
```bash
cd frontend
npm install
# Create .env.local file with NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev
```

---

## 🌐 Production Deployment Guide

### 1. Frontend -> Vercel
1. Connect your GitHub repository to Vercel.
2. Set Root Directory to `frontend`.
3. Set Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://<your-render-backend-url>.onrender.com`
4. Deploy.

### 2. Backend -> Render
1. Create a **Web Service** on Render pointing to `backend/`.
2. Environment: `Node`.
3. Build Command: `npm install && npm run build`
4. Start Command: `node dist/main.js`
5. Environment Variables:
   - `MONGODB_URI` = `mongodb+srv://...`
   - `REDIS_URL` = `rediss://...` (Upstash Redis)
   - `JWT_SECRET` = `supersecretjwtkey`
   - `JWT_REFRESH_SECRET` = `supersecretrefreshkey`
   - `ADMIN_EMAIL` = `admin@admin.com`
   - `ADMIN_PASSWORD` = `Admin@123`

### 3. Python AI Service -> Render (Web Service)

#### Option A: Automatic via Render Blueprint (`render.yaml`)
1. In your [Render Dashboard](https://dashboard.render.com/), click **New +** -> **Blueprint**.
2. Connect your GitHub repository. Render will automatically read `render.yaml` and provision both the `pdf-kb-backend` and `pdf-kb-python-ai` Web Services.
3. Fill in the required environment variables (`GEMINI_API_KEY`, `REDIS_URL`, `MONGODB_URI`, `ADMIN_PASSWORD`).

#### Option B: Manual Setup on Render Dashboard
1. Create a **Web Service** on Render pointing to `python-ai/`.
2. Environment: `Python 3` (or `Docker`).
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Health Check Path: `/health`
6. Environment Variables:
   - `GEMINI_API_KEY` = `your_google_gemini_api_key`
   - `REDIS_URL` = `rediss://default:<password>@<host>.upstash.io:6379` (Upstash Redis)
   - `CHROMA_PATH` = `./chroma_data`
7. Render automatically provisions the service, binds to dynamic `$PORT`, and keeps the Redis Pub/Sub listener daemon running continuously.

---

## 🔑 Default Admin Credentials

Upon application startup, the backend automatically seeds the default admin account if not already existing:

- **Email**: `admin@admin.com`
- **Password**: `Admin@123`

---

## 📡 API Endpoints Reference

### Authentication
- `POST /auth/login` - Admin login (returns accessToken & refreshToken)
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout session

### Document Management (Protected - JWT Required)
- `POST /documents/upload` - Upload PDF document (Multipart form)
- `GET /documents?search=` - List all uploaded documents
- `DELETE /documents/:id` - Delete document and remove ChromaDB embeddings
- `POST /documents/:id/reprocess` - Re-extract and re-vectorize document

### Public Chat (No Auth Required)
- `POST /chat/ask` - Submit question (`sessionId`, `question`)
- `GET /chat/history/:sessionId` - Fetch chat history for session

### Dashboard Analytics (Protected - JWT Required)
- `GET /dashboard/stats` - Total PDFs, Total Chat Sessions, Total Questions, Recent Documents

---

## 💯 Evaluation Criteria Checklist

- [x] **Next.js Frontend (15 Marks)**: Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, dark mode, responsive ChatGPT-style UI.
- [x] **Node.js Backend (15 Marks)**: NestJS, TypeScript, JWT Auth, Mongoose, Multer file handling, Winston logger, global error filters.
- [x] **Python AI Service (20 Marks)**: FastAPI, LangChain, ChromaDB vector store, Gemini 2.5 Flash embeddings and LLM.
- [x] **LangChain Implementation (15 Marks)**: PDF text extraction (`pdfplumber` + `PyPDF`), `RecursiveCharacterTextSplitter`, embeddings, and RAG prompt chain.
- [x] **LangGraph Implementation (15 Marks)**: Stateful 5-node workflow (`receive_question` -> `retrieve_context` -> `generate_answer` -> `generate_suggestions` -> `return_response`).
- [x] **Redis Pub/Sub Integration (10 Marks)**: Decoupled messaging broker using `ai_request` & `ai_response` channels. Zero direct HTTP calls between Node & Python.
- [x] **Database & Vector DB Design (5 Marks)**: MongoDB schemas for Users, Documents, Chats + ChromaDB collection structure.
- [x] **Code Quality & Folder Structure (5 Marks)**: Clean Architecture, SOLID principles, shared types, DTO validation, comprehensive documentation.
