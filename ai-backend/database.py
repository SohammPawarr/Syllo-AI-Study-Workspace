"""MongoDB connection and helper functions."""

# pyrefly: ignore [missing-import]
from pymongo import MongoClient
# pyrefly: ignore [missing-import]
from pymongo.database import Database
# pyrefly: ignore [missing-import]
from bson import ObjectId
import certifi
from config import settings

_client: MongoClient | None = None


def get_db() -> Database:
    """Return a cached MongoDB database handle."""
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGODB_URI, tlsCAFile=certifi.where())
    return _client[settings.MONGODB_DB_NAME]


# ---------------------------------------------------------------------------
# Document helpers
# ---------------------------------------------------------------------------

def update_document_status(workspace_id: str, status: str, error_message: str | None = None) -> None:
    """Update the processingStatus field of a document."""
    db = get_db()
    # Try ObjectId first, fall back to string match
    try:
        filter_id = ObjectId(workspace_id)
    except Exception:
        filter_id = workspace_id
        
    update_data = {"processingStatus": status}
    if error_message is not None:
        update_data["errorMessage"] = error_message
        
    db.documents.update_one(
        {"_id": filter_id},
        {"$set": update_data},
    )


def get_document(workspace_id: str) -> dict | None:
    """Fetch a single document by ID."""
    db = get_db()
    try:
        filter_id = ObjectId(workspace_id)
    except Exception:
        filter_id = workspace_id
    return db.documents.find_one({"_id": filter_id})


def insert_chunks(chunks: list[dict]) -> None:
    """Bulk-insert document chunks with embeddings."""
    if not chunks:
        return
    db = get_db()
    db.documentchunks.insert_many(chunks)


def get_chunks_for_workspace(workspace_id: str, limit: int = 50) -> list[dict]:
    """Retrieve stored chunks for a given workspace."""
    db = get_db()
    return list(
        db.documentchunks.find({"workspaceId": workspace_id}).limit(limit)
    )


def save_quiz(quiz_data: dict) -> str:
    """Persist a generated quiz and return its inserted ID."""
    db = get_db()
    result = db.quizzes.insert_one(quiz_data)
    return str(result.inserted_id)
