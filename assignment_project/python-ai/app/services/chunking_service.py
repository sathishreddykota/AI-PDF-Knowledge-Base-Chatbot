"""
Chunking Service
Splits extracted PDF text into semantic chunks using LangChain's RecursiveCharacterTextSplitter.
"""

import logging

from langchain.text_splitter import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

# Configuration as specified in the assignment
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 100


def chunk_pages(pages: list[dict], document_id: str, filename: str) -> list[dict]:
    """
    Split page text into chunks with metadata.

    Args:
        pages: List of { "page": int, "text": str }
        document_id: Unique document identifier
        filename: Original PDF filename

    Returns:
        List of chunk dicts: { "text": str, "metadata": { ... } }
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = []

    for page in pages:
        page_chunks = splitter.split_text(page["text"])

        for i, chunk_text in enumerate(page_chunks):
            chunks.append({
                "text": chunk_text,
                "metadata": {
                    "document_id": document_id,
                    "filename": filename,
                    "page_number": page["page"],
                    "chunk_index": i,
                },
            })

    logger.info(
        f"Split document '{filename}' into {len(chunks)} chunks "
        f"from {len(pages)} pages"
    )
    return chunks
