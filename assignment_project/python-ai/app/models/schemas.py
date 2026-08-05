"""
Pydantic models (schemas) for all data types used across the AI service.
"""

from typing import Optional
from pydantic import BaseModel


class SourceDocument(BaseModel):
    """Reference to a source document chunk."""
    filename: str
    page_number: Optional[int] = None


class ChatHistoryItem(BaseModel):
    """A single chat message in conversation history."""
    role: str  # 'user' or 'assistant'
    content: str


class AIRequest(BaseModel):
    """Incoming request from Redis Pub/Sub."""
    request_id: str
    type: str  # 'chat', 'process', 'delete'
    session_id: Optional[str] = None
    question: Optional[str] = None
    chat_history: Optional[list[ChatHistoryItem]] = []
    document_id: Optional[str] = None
    filename: Optional[str] = None
    file_data: Optional[str] = None  # base64 encoded PDF


class AIResponse(BaseModel):
    """Outgoing response published to Redis."""
    request_id: str
    success: bool
    answer: Optional[str] = None
    sources: Optional[list[SourceDocument]] = []
    suggested_questions: Optional[list[str]] = []
    error: Optional[str] = None


class GraphState(BaseModel):
    """State passed through LangGraph nodes."""
    question: str = ""
    chat_history: list[ChatHistoryItem] = []
    context: str = ""
    sources: list[SourceDocument] = []
    answer: str = ""
    suggested_questions: list[str] = []
