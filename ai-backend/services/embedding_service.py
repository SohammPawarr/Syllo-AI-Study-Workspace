"""Vector embedding generation service using fastembed for low memory footprint."""

from fastembed import TextEmbedding
from config import settings

# Lazy load the model to avoid huge startup times if not used immediately
_model = None

def get_embedding_model():
    global _model
    if _model is None:
        model_name = settings.EMBEDDING_MODEL or "sentence-transformers/all-MiniLM-L6-v2"
        _model = TextEmbedding(model_name=model_name)
    return _model

def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text strings using fastembed.
    """
    if not texts:
        return []
    
    model = get_embedding_model()
    # fastembed returns a generator of numpy arrays
    embeddings_generator = model.embed(texts)
    embeddings = [emb.tolist() for emb in embeddings_generator]
    return embeddings

def generate_single_embedding(text: str) -> list[float]:
    """Generate an embedding for a single text string."""
    model = get_embedding_model()
    embeddings_generator = model.embed([text])
    embedding = next(embeddings_generator)
    return embedding.tolist()

