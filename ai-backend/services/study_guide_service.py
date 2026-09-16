"""Service for generating comprehensive study guides."""

from groq import Groq
from config import settings

_client = None

def get_groq_client():
    global _client
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client

def generate_study_guide(context: str, topic: str) -> str:
    client = get_groq_client()
    
    prompt = f"""You are Syllo, an expert tutor.
Create a comprehensive, beautifully formatted Markdown study guide on the topic: '{topic}'.
Use ONLY the information provided in the Context below. Do not hallucinate.

The study guide must include:
1. An Executive Summary
2. Key Concepts & Definitions (bullet points)
3. Important Chronological Timelines or Processes (if applicable)
4. A quick 3-question self-test at the end.

--- Context ---
{context}
"""

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
    )
    
    return response.choices[0].message.content
