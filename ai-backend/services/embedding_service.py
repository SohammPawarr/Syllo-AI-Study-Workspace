"""Vector embedding generation service using local sentence-transformers."""

from sentence_transformers import SentenceTransformer
from config import settings

# Lazy load the model to avoid huge startup times if not used immediately
_model = None

def get_embedding_model():
    global _model
    if _model is None:
        model_name = settings.EMBEDDING_MODEL or "all-MiniLM-L6-v2"
        _model = SentenceTransformer(model_name)
    return _model

def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text strings using local model.
    """
    if not texts:
        return []
    
    model = get_embedding_model()
    # SentenceTransformer encodes to numpy arrays, convert to list of floats
    embeddings = model.encode(texts, convert_to_numpy=True)
    return embeddings.tolist()

def generate_single_embedding(text: str) -> list[float]:
    """Generate an embedding for a single text string."""
    model = get_embedding_model()
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding.tolist()
