"""
Embedding Service + ChromaDB Vector Store
Manages embedding generation (Gemini) and ChromaDB storage/retrieval.
"""

import logging

import chromadb
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.config import settings

logger = logging.getLogger(__name__)

# Module-level singletons (initialized lazily)
_chroma_client: chromadb.ClientAPI | None = None
_embedding_model: GoogleGenerativeAIEmbeddings | None = None

COLLECTION_NAME = "pdf_knowledge_base"


def _get_chroma_client() -> chromadb.ClientAPI:
    """Get or create the ChromaDB persistent client."""
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path=settings.chroma_path)
        logger.info(f"ChromaDB initialized at {settings.chroma_path}")
    return _chroma_client


def _get_embedding_model() -> GoogleGenerativeAIEmbeddings:
    """Get or create the Gemini embedding model."""
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=settings.gemini_api_key,
        )
        logger.info("Gemini embedding model initialized")
    return _embedding_model


def _get_collection() -> chromadb.Collection:
    """Get or create the ChromaDB collection."""
    client = _get_chroma_client()
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


def add_chunks_to_store(chunks: list[dict]) -> int:
    """
    Generate embeddings and store chunks in ChromaDB.

    Args:
        chunks: List of { "text": str, "metadata": { document_id, filename, page_number, chunk_index } }

    Returns:
        Number of chunks stored
    """
    if not chunks:
        return 0

    collection = _get_collection()
    embedding_model = _get_embedding_model()

    texts = [c["text"] for c in chunks]
    metadatas = [c["metadata"] for c in chunks]
    ids = [
        f"{c['metadata']['document_id']}_chunk_{i}"
        for i, c in enumerate(chunks)
    ]

    # Generate embeddings in batches to avoid API limits
    batch_size = 50
    for start in range(0, len(texts), batch_size):
        end = min(start + batch_size, len(texts))
        batch_texts = texts[start:end]
        batch_ids = ids[start:end]
        batch_metadatas = metadatas[start:end]

        embeddings = embedding_model.embed_documents(batch_texts)

        # Convert metadata values to strings for ChromaDB compatibility
        clean_metadatas = []
        for m in batch_metadatas:
            clean_metadatas.append({
                k: str(v) for k, v in m.items()
            })

        collection.add(
            ids=batch_ids,
            embeddings=embeddings,
            documents=batch_texts,
            metadatas=clean_metadatas,
        )

        logger.info(f"Stored batch {start}-{end} of {len(texts)} chunks")

    logger.info(f"Total {len(chunks)} chunks stored in ChromaDB")
    return len(chunks)


def search_similar(query: str, top_k: int = 5) -> list[dict]:
    """
    Search ChromaDB for chunks similar to the query.

    Returns list of { "text": str, "metadata": { ... }, "score": float }
    """
    collection = _get_collection()
    embedding_model = _get_embedding_model()

    query_embedding = embedding_model.embed_query(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    search_results = []
    if results and results["documents"]:
        for i, doc in enumerate(results["documents"][0]):
            search_results.append({
                "text": doc,
                "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                "score": 1 - (results["distances"][0][i] if results["distances"] else 0),
            })

    logger.info(f"Found {len(search_results)} similar chunks for query")
    return search_results


def delete_document_vectors(document_id: str) -> None:
    """Remove all vectors for a specific document from ChromaDB."""
    collection = _get_collection()

    # Get all IDs matching this document
    results = collection.get(
        where={"document_id": document_id},
        include=[],
    )

    if results and results["ids"]:
        collection.delete(ids=results["ids"])
        logger.info(
            f"Deleted {len(results['ids'])} vectors for document {document_id}"
        )
    else:
        logger.info(f"No vectors found for document {document_id}")
