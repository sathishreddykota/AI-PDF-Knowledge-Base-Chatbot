"""
Redis Pub/Sub Handler
Subscribes to 'ai_request' channel, dispatches to appropriate handlers,
and publishes responses back to 'ai_response:{requestId}'.
"""

import asyncio
import json
import logging
import threading

import redis

from app.config import settings
from app.models.schemas import AIRequest, AIResponse, ChatHistoryItem
from app.services.pdf_processor import extract_text_from_pdf
from app.services.chunking_service import chunk_pages
from app.services.embedding_service import add_chunks_to_store, delete_document_vectors
from app.services.langgraph_workflow import run_rag_pipeline

logger = logging.getLogger(__name__)


def _get_redis_client() -> redis.Redis:
    """Create a Redis client from the configured URL."""
    return redis.from_url(
        settings.redis_url,
        decode_responses=True,
        socket_timeout=30,
        retry_on_timeout=True,
    )


def _handle_chat_request(request: AIRequest, pub_client: redis.Redis) -> None:
    """Handle a chat/question request through the RAG pipeline."""
    logger.info(f"Processing chat request: {request.request_id}")

    try:
        # Convert chat history to the expected format
        chat_history = [
            ChatHistoryItem(role=h.role, content=h.content)
            for h in (request.chat_history or [])
        ]

        # Run the LangGraph RAG pipeline
        result = run_rag_pipeline(
            question=request.question or "",
            chat_history=chat_history,
        )

        response = AIResponse(
            request_id=request.request_id,
            success=True,
            answer=result["answer"],
            sources=result["sources"],
            suggested_questions=result["suggested_questions"],
        )

    except Exception as e:
        logger.error(f"Chat processing failed: {e}", exc_info=True)
        response = AIResponse(
            request_id=request.request_id,
            success=False,
            error=f"AI processing failed: {str(e)}",
        )

    # Publish response back via Redis
    response_channel = f"ai_response:{request.request_id}"
    pub_client.publish(response_channel, response.model_dump_json())
    logger.info(f"Published response to {response_channel}")


def _handle_process_request(request: AIRequest, pub_client: redis.Redis) -> None:
    """Handle a PDF processing request."""
    logger.info(f"Processing PDF: {request.filename} (doc: {request.document_id})")

    try:
        if not request.file_data:
            raise ValueError("No file data provided")

        # Step 1: Extract text from PDF
        pages = extract_text_from_pdf(request.file_data)
        if not pages:
            raise ValueError("No text could be extracted from the PDF")

        # Step 2: Chunk the extracted text
        chunks = chunk_pages(
            pages=pages,
            document_id=request.document_id or "",
            filename=request.filename or "unknown.pdf",
        )

        # Step 3: Generate embeddings and store in ChromaDB
        total_chunks = add_chunks_to_store(chunks)

        response = AIResponse(
            request_id=request.request_id,
            success=True,
            answer=f"Successfully processed {len(pages)} pages into {total_chunks} chunks",
        )

    except Exception as e:
        logger.error(f"PDF processing failed: {e}", exc_info=True)
        response = AIResponse(
            request_id=request.request_id,
            success=False,
            error=f"PDF processing failed: {str(e)}",
        )

    response_channel = f"ai_response:{request.request_id}"
    pub_client.publish(response_channel, response.model_dump_json())
    logger.info(f"Published process response to {response_channel}")


def _handle_delete_request(request: AIRequest, pub_client: redis.Redis) -> None:
    """Handle a document deletion request (remove vectors from ChromaDB)."""
    logger.info(f"Deleting vectors for document: {request.document_id}")

    try:
        delete_document_vectors(request.document_id or "")

        response = AIResponse(
            request_id=request.request_id,
            success=True,
            answer="Document vectors deleted successfully",
        )
    except Exception as e:
        logger.error(f"Delete failed: {e}", exc_info=True)
        response = AIResponse(
            request_id=request.request_id,
            success=False,
            error=f"Delete failed: {str(e)}",
        )

    response_channel = f"ai_response:{request.request_id}"
    pub_client.publish(response_channel, response.model_dump_json())


def _subscriber_loop() -> None:
    """
    Main subscriber loop. Runs in a background thread.
    Listens on 'ai_request' channel and dispatches to handlers.
    """
    sub_client = _get_redis_client()
    pub_client = _get_redis_client()
    pubsub = sub_client.pubsub()

    pubsub.subscribe("ai_request")
    logger.info("Subscribed to 'ai_request' channel — waiting for messages")

    for message in pubsub.listen():
        if message["type"] != "message":
            continue

        try:
            data = json.loads(message["data"])
            request = AIRequest(**data)

            logger.info(
                f"Received {request.type} request: {request.request_id}"
            )

            # Dispatch to the appropriate handler
            if request.type == "chat":
                _handle_chat_request(request, pub_client)
            elif request.type == "process":
                _handle_process_request(request, pub_client)
            elif request.type == "delete":
                _handle_delete_request(request, pub_client)
            elif request.type == "ping":
                logger.info(f"Keep-alive ping acknowledged: {request.request_id}")
            else:
                logger.warning(f"Unknown request type: {request.type}")

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in message: {e}")
        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)


def start_subscriber() -> None:
    """Start the Redis subscriber in a background daemon thread."""
    thread = threading.Thread(target=_subscriber_loop, daemon=True)
    thread.start()
    logger.info("Redis subscriber thread started")
