"""Service for generating a structured study planner/schedule using Groq."""

from groq import Groq
from config import settings

_client = None

def get_groq_client():
    global _client
    if _client is None:
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not configured")
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client

def generate_study_plan(context: str, topic: str) -> str:
    """
    Generate a detailed markdown study schedule based on the provided text context.
    """
    prompt = f"""
You are an expert academic planner and tutor.
Based on the following extracted text from a student's study materials, create a comprehensive, day-by-day study schedule/planner for the topic: "{topic}".

The schedule should:
1. Break down the material into logical daily or weekly chunks (e.g., Day 1, Day 2, etc.).
2. Include specific learning objectives for each session based on the actual provided context.
3. Suggest active recall exercises, review sessions, and estimated time commitments.
4. Be formatted in highly readable Markdown (use headings, lists, bold text, and tables if useful).

Do NOT invent information that is not supported by the context. If the context is very short, adapt the schedule to just a few sessions.

=== DOCUMENT CONTEXT ===
{context}
========================

Provide only the Markdown study planner in your response.
"""
    
    client = get_groq_client()
    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
    )
    
    return response.choices[0].message.content.strip()
