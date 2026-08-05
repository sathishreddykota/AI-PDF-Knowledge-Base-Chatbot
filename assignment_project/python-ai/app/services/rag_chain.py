"""
LangChain RAG Chain
Handles answer generation using Gemini 2.5 Flash with LangChain.
"""

import logging

from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings
from app.prompts.answer_prompt import ANSWER_PROMPT
from app.prompts.suggestions_prompt import SUGGESTIONS_PROMPT

logger = logging.getLogger(__name__)

# Module-level LLM singleton
_llm: ChatGoogleGenerativeAI | None = None


def _get_llm() -> ChatGoogleGenerativeAI:
    """Get or create the Gemini 2.5 Flash LLM instance."""
    global _llm
    if _llm is None:
        _llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-preview-05-20",
            google_api_key=settings.gemini_api_key,
            temperature=0.3,
            max_output_tokens=2048,
        )
        logger.info("Gemini 2.5 Flash LLM initialized")
    return _llm


def generate_answer(
    question: str,
    context: str,
    chat_history: str,
) -> str:
    """
    Generate a grounded answer using the RAG prompt and Gemini.

    Args:
        question: User's question
        context: Retrieved document chunks
        chat_history: Formatted conversation history

    Returns:
        Generated answer string
    """
    llm = _get_llm()
    prompt = PromptTemplate(
        template=ANSWER_PROMPT,
        input_variables=["context", "chat_history", "question"],
    )

    chain = prompt | llm

    response = chain.invoke({
        "context": context,
        "chat_history": chat_history,
        "question": question,
    })

    return response.content


def generate_suggestions(
    question: str,
    answer: str,
    context: str,
) -> list[str]:
    """
    Generate 3-5 follow-up question suggestions.

    Args:
        question: Original user question
        answer: Generated answer
        context: Retrieved document chunks

    Returns:
        List of suggested follow-up questions
    """
    llm = _get_llm()
    prompt = PromptTemplate(
        template=SUGGESTIONS_PROMPT,
        input_variables=["context", "question", "answer"],
    )

    chain = prompt | llm

    response = chain.invoke({
        "context": context,
        "question": question,
        "answer": answer,
    })

    # Parse the response into individual questions
    raw_questions = response.content.strip().split("\n")
    suggestions = [
        q.strip().lstrip("•-0123456789. ")
        for q in raw_questions
        if q.strip() and len(q.strip()) > 5
    ]

    # Ensure we return 3-5 questions
    return suggestions[:5]
