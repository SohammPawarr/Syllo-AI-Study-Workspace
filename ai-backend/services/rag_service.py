"""RAG retrieval — find the most relevant chunks for a query."""

import numpy as np
from database import get_chunks_for_workspace
from services.embedding_service import generate_single_embedding


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    a_arr = np.array(a)
    b_arr = np.array(b)
    dot = np.dot(a_arr, b_arr)
    norm = np.linalg.norm(a_arr) * np.linalg.norm(b_arr)
    if norm == 0:
        return 0.0
    return float(dot / norm)


def retrieve_relevant_chunks(
    workspace_id: str,
    query: str,
    top_k: int = 10,
) -> str:
    """
    Given a document ID and a natural-language query, retrieve the
    top-k most relevant chunks by cosine similarity and return them
    concatenated as a single context string.
    """
    # 1. Embed the query
    query_embedding = generate_single_embedding(query)

    # 2. Fetch all stored chunks for this document
    chunks = get_chunks_for_workspace(workspace_id, limit=200)

    if not chunks:
        raise ValueError(f"No chunks found for document {workspace_id}")

    # 3. Score each chunk
    scored: list[tuple[float, str]] = []
    for chunk in chunks:
        embedding = chunk.get("embedding", [])
        if not embedding:
            continue
        score = cosine_similarity(query_embedding, embedding)
        scored.append((score, chunk["text"]))

    # 4. Sort descending and take top-k
    scored.sort(key=lambda x: x[0], reverse=True)
    top_chunks = [text for _, text in scored[:top_k]]

    return "\n\n---\n\n".join(top_chunks)
