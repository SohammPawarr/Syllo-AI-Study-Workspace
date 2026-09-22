"""
Background tasks without Celery for free deployment.
"""
from services.parser_service import extract_markdown_from_file, chunk_markdown
from services.embedding_service import generate_embeddings
from database import update_document_status, insert_chunks
import threading
import traceback

# A global lock to ensure we only process one document at a time and prevent OOM
_process_lock = threading.Lock()

def process_document_background(workspace_id: str, file_url: str):
    """
    Full ingestion pipeline: extract → chunk → embed → store.
    """
    with _process_lock:
        try:
            # Step 1: Extract Markdown
            update_document_status(workspace_id, "EXTRACTING")
            raw_markdown = extract_markdown_from_file(file_url)

            if not raw_markdown.strip():
                raise ValueError("The uploaded document appears to be empty or contains no selectable text.")

            # Step 2: Chunk Semantically
            update_document_status(workspace_id, "CHUNKING")
            chunks = chunk_markdown(raw_markdown)

            # Step 3: Embed
            update_document_status(workspace_id, "EMBEDDING")
            texts = [c["text"] for c in chunks]
            embeddings = generate_embeddings(texts)

            # Step 4: Store
            chunk_docs = []
            for chunk, embedding in zip(chunks, embeddings):
                chunk_docs.append(
                    {
                        "workspaceId": workspace_id,
                        "chunkIndex": chunk["index"],
                        "text": chunk["text"],
                        "embedding": embedding,
                    }
                )
            insert_chunks(chunk_docs)

            # Step 5: Mark complete
            update_document_status(workspace_id, "READY")

        except Exception as e:
            print("====== BACKGROUND TASK FAILED ======")
            traceback.print_exc()
            print("================================")
            update_document_status(workspace_id, "FAILED", error_message=str(e))
