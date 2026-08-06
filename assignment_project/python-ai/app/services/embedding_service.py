"""
Embedding Service + ChromaDB Vector Store
Manages embedding generation (Gemini) and ChromaDB storage/retrieval.
Optimized with parallel batch processing for fast ingestion.
"""

import concurrent.futures
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
            model="models/gemini-embedding-001",
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
    Generate embeddings and store chunks in ChromaDB with parallel batch processing.

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

    batch_size = 50
    batches = [
        (texts[i:i + batch_size], ids[i:i + batch_size], metadatas[i:i + batch_size])
        for i in range(0, len(texts), batch_size)
    ]

    def process_batch(batch):
        b_texts, b_ids, b_metadatas = batch
        embeddings = embedding_model.embed_documents(b_texts)
        clean_metadatas = [{k: str(v) for k, v in m.items()} for m in b_metadatas]
        return b_ids, embeddings, b_texts, clean_metadatas

    all_ids, all_embeddings, all_texts, all_clean_metadatas = [], [], [], []

    # Parallelize embedding API requests across batches using ThreadPoolExecutor
    with concurrent.futures.ThreadPoolExecutor(max_workers=min(4, len(batches))) as executor:
        results = list(executor.map(process_batch, batches))
        for b_ids, embeddings, b_texts, clean_metadatas in results:
            all_ids.extend(b_ids)
            all_embeddings.extend(embeddings)
            all_texts.extend(b_texts)
            all_clean_metadatas.extend(clean_metadatas)

    # Insert into ChromaDB in one batch
    collection.add(
        ids=all_ids,
        embeddings=all_embeddings,
        documents=all_texts,
        metadatas=all_clean_metadatas,
    )

    logger.info(f"Total {len(chunks)} chunks stored in ChromaDB in parallel")
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
