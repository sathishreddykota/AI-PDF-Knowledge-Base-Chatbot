# System Architecture Diagram & Description

This document provides the high-level system architecture and interaction flow for the AI PDF Knowledge Base Chatbot system.

---

## 🗺️ Architectural Diagram

The diagram below details the physical layout, interfaces, and databases mapping each service component.

```mermaid
graph TD
    %% Styling
    classDef client fill:#e6f5ff,stroke:#0066cc,stroke-width:2px;
    classDef backend fill:#fff0f5,stroke:#cc0066,stroke-width:2px;
    classDef broker fill:#fffacd,stroke:#d4af37,stroke-width:2px;
    classDef ai fill:#f0fff0,stroke:#008000,stroke-width:2px;
    classDef external fill:#f9f9f9,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5;

    %% Components
    FE[Next.js 15 Frontend<br/>React 19 / Tailwind]:::client
    BE[Node.js NestJS Backend<br/>REST APIs & Auth]:::backend
    Redis[Redis Pub/Sub<br/>ioredis / redis-py]:::broker
    AI[Python AI Microservice<br/>FastAPI / LangGraph]:::ai

    %% Databases
    DB[(MongoDB Atlas<br/>Users, Docs, Chats)]:::external
    Vector[(ChromaDB Vector Store<br/>PDF Embeddings)]:::ai

    %% External APIs
    Gemini[Google Gemini API<br/>Embeddings & Chat]:::external

    %% Relations
    FE <-->|HTTP / JSON| BE
    BE <-->|Mongoose| DB
    BE -->|Publish Request<br/>ai_request| Redis
    Redis -->|Subscribe Request| AI
    AI -->|Publish Response<br/>ai_response:reqId| Redis
    Redis -->|Subscribe Response| BE
    AI <-->|Local Persistent IO| Vector
    AI <-->|gRPC / REST| Gemini
```

---

## 🔁 Request-Reply Communication Flow

The backend communicates with the Python service through **Redis Pub/Sub** using an asynchronous request-response cycle:

```mermaid
sequenceDiagram
    autonumber
    participant Client as Next.js Client
    participant Backend as NestJS Server
    participant Redis as Redis Broker
    participant AI as Python AI Service

    Client->>Backend: API Request (e.g. POST /chat/ask)
    Backend->>Backend: Generate unique Request ID (UUID v4)
    Backend->>Redis: Publish request payload to 'ai_request'
    Backend->>Backend: Register Promise resolver for 'ai_response:reqId'
    Redis->>AI: Trigger subscription message
    AI->>AI: Execute pipeline (RAG query / PDF processing)
    AI->>Redis: Publish result payload to 'ai_response:reqId'
    Redis->>Backend: Trigger pmessage pattern handler
    Backend->>Backend: Resolve active Promise & clean timeout timer
    Backend-->>Client: Return JSON response
```

---

## 🧩 Architectural Design Rationale

1. **Decoupled Architecture**: 
   Direct HTTP connections between the API server and the AI server are avoided. Using Redis Pub/Sub prevents requests from backing up, isolates server crashes, and makes it easy to add more AI worker instances when traffic increases.
2. **Double-Extraction PDF Strategy**:
   The AI service tries using `pypdf` first because it is 10x faster. If the text returns empty (common with scanned documents or tables), it falls back to `pdfplumber` to extract high-fidelity text.
3. **Matryoshka Embeddings**:
   The system uses the modern `models/gemini-embedding-001` model to generate 3072-dimensional semantic embeddings. The higher dimensionality provides superior search accuracy compared to legacy 768-dimensional models.
4. **Stateful Graph Orchestration**:
   Rather than chaining prompts sequentially, the chat pipeline is implemented as a stateful graph in **LangGraph**. This guarantees strict path transitions, reliable error-handling states, and clean separation between context retrieval, answering, and suggestion generation.
