"""
LangGraph Workflow — RAG Pipeline
Implements the mandatory 5-node graph:
  receive_question → retrieve_context → generate_answer → generate_suggestions → return_response
"""

import logging
from typing import TypedDict

from langgraph.graph import StateGraph, END

from app.models.schemas import ChatHistoryItem, SourceDocument
from app.services.embedding_service import search_similar
from app.services.rag_chain import generate_answer, generate_suggestions

logger = logging.getLogger(__name__)


# ---- Graph State Definition ----

class WorkflowState(TypedDict):
    """Typed state passed through LangGraph nodes."""
    question: str
    chat_history: list[ChatHistoryItem]
    context: str
    sources: list[SourceDocument]
    answer: str
    suggested_questions: list[str]


# ---- Node 1: Receive Question ----

def receive_question(state: WorkflowState) -> WorkflowState:
    """
    Parse and validate the incoming question.
    Formats chat history for the prompt.
    """
    logger.info(f"Node 1 — Receiving question: {state['question'][:100]}")

    # Format chat history as a readable string (done in later node)
    return state


# ---- Node 2: Retrieve Context ----

def retrieve_context(state: WorkflowState) -> WorkflowState:
    """
    Search ChromaDB for relevant document chunks.
    Uses similarity search with top_k=5.
    """
    logger.info("Node 2 — Retrieving context from ChromaDB")

    search_results = search_similar(query=state["question"], top_k=5)

    if not search_results:
        logger.info("No relevant context found in ChromaDB")
        state["context"] = "No relevant documents found."
        state["sources"] = []
        return state

    # Build context string from search results
    context_parts = []
    sources = []
    seen_sources = set()

    for result in search_results:
        metadata = result["metadata"]
        context_parts.append(
            f"[Source: {metadata.get('filename', 'Unknown')}, "
            f"Page: {metadata.get('page_number', 'N/A')}]\n"
            f"{result['text']}"
        )

        # Track unique sources
        source_key = (
            metadata.get("filename", "Unknown"),
            metadata.get("page_number"),
        )
        if source_key not in seen_sources:
            seen_sources.add(source_key)
            sources.append(SourceDocument(
                filename=metadata.get("filename", "Unknown"),
                page_number=int(metadata["page_number"]) if metadata.get("page_number") else None,
            ))

    state["context"] = "\n\n---\n\n".join(context_parts)
    state["sources"] = sources

    logger.info(f"Retrieved {len(search_results)} chunks from {len(sources)} sources")
    return state


# ---- Node 3: Generate Answer ----

def generate_answer_node(state: WorkflowState) -> WorkflowState:
    """
    Generate a grounded answer using LangChain + Gemini.
    """
    logger.info("Node 3 — Generating answer with Gemini 2.5 Flash")

    # Format chat history for the prompt
    chat_history_str = ""
    if state["chat_history"]:
        for msg in state["chat_history"][-6:]:  # Last 6 messages for context window
            role = "User" if msg.role == "user" else "Assistant"
            chat_history_str += f"{role}: {msg.content}\n"

    answer = generate_answer(
        question=state["question"],
        context=state["context"],
        chat_history=chat_history_str,
    )

    state["answer"] = answer
    logger.info(f"Answer generated ({len(answer)} chars)")
    return state


# ---- Node 4: Generate Suggested Questions ----

def generate_suggestions_node(state: WorkflowState) -> WorkflowState:
    """
    Generate 3-5 follow-up question suggestions.
    """
    logger.info("Node 4 — Generating follow-up suggestions")

    suggestions = generate_suggestions(
        question=state["question"],
        answer=state["answer"],
        context=state["context"],
    )

    state["suggested_questions"] = suggestions
    logger.info(f"Generated {len(suggestions)} follow-up suggestions")
    return state


# ---- Node 5: Return Response ----

def return_response(state: WorkflowState) -> WorkflowState:
    """
    Format the final response. This is the terminal node.
    """
    logger.info("Node 5 — Formatting final response")
    return state


# ---- Build the Graph ----

def build_rag_workflow() -> StateGraph:
    """
    Build and compile the LangGraph RAG workflow.

    Graph: receive_question → retrieve_context → generate_answer →
           generate_suggestions → return_response → END
    """
    workflow = StateGraph(WorkflowState)

    # Add nodes
    workflow.add_node("receive_question", receive_question)
    workflow.add_node("retrieve_context", retrieve_context)
    workflow.add_node("generate_answer", generate_answer_node)
    workflow.add_node("generate_suggestions", generate_suggestions_node)
    workflow.add_node("return_response", return_response)

    # Add edges (linear flow)
    workflow.set_entry_point("receive_question")
    workflow.add_edge("receive_question", "retrieve_context")
    workflow.add_edge("retrieve_context", "generate_answer")
    workflow.add_edge("generate_answer", "generate_suggestions")
    workflow.add_edge("generate_suggestions", "return_response")
    workflow.add_edge("return_response", END)

    return workflow.compile()


# Pre-compiled workflow instance
rag_workflow = build_rag_workflow()


def run_rag_pipeline(
    question: str,
    chat_history: list[ChatHistoryItem] | None = None,
) -> dict:
    """
    Execute the full RAG pipeline through LangGraph.

    Args:
        question: User's question
        chat_history: Previous conversation messages

    Returns:
        Dict with answer, sources, and suggested_questions
    """
    initial_state: WorkflowState = {
        "question": question,
        "chat_history": chat_history or [],
        "context": "",
        "sources": [],
        "answer": "",
        "suggested_questions": [],
    }

    result = rag_workflow.invoke(initial_state)

    return {
        "answer": result["answer"],
        "sources": [s.model_dump() for s in result["sources"]],
        "suggested_questions": result["suggested_questions"],
    }
