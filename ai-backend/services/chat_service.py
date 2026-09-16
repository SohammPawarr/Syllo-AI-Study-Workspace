"""Service for handling document chat using Agentic RAG with Groq."""

import json
from groq import Groq
from config import settings
from services.rag_service import retrieve_relevant_chunks

_client = None

def get_groq_client():
    global _client
    if _client is None:
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not configured")
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client

def generate_chat_response(workspace_id: str, messages: list[dict]) -> str:
    """
    Agentic RAG implementation using Groq tool calling.
    The LLM decides whether to search the workspace or answer from history.
    """
    client = get_groq_client()
    
    system_prompt = f"""You are Syllo, an intelligent AI study assistant developed by Soham Pawar.
You have access to a tool called `search_workspace` which searches the user's uploaded documents.
If the user asks a question about their study materials, you MUST use the `search_workspace` tool to find the answer.
If the user is just saying hello or asking a general question that relies on previous conversation history, you can answer directly.
If the search results don't contain the answer, tell the user the information is missing from their documents.
"""

    formatted_messages = [{"role": "system", "content": system_prompt}]
    
    for msg in messages:
        role = "assistant" if msg["role"] in ["assistant", "model"] else "user"
        formatted_messages.append({"role": role, "content": msg["content"]})

    tools = [
        {
            "type": "function",
            "function": {
                "name": "search_workspace",
                "description": "Search the user's uploaded documents for information relevant to a query.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The search query, e.g., 'What is mitosis?'"
                        }
                    },
                    "required": ["query"]
                }
            }
        }
    ]

    # Step 1: Initial call to see if it wants to use a tool
    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=formatted_messages,
        tools=tools,
        tool_choice="auto",
        temperature=0.3,
    )

    response_message = response.choices[0].message
    tool_calls = response_message.tool_calls

    if tool_calls:
        # Step 2: It wants to search! Execute the tool.
        formatted_messages.append(response_message) # Append the tool call
        
        for tool_call in tool_calls:
            function_args = json.loads(tool_call.function.arguments)
            search_query = function_args.get("query")
            
            # Perform actual Vector Search
            try:
                search_results = retrieve_relevant_chunks(
                    workspace_id=workspace_id,
                    query=search_query,
                    top_k=10
                )
            except Exception as e:
                search_results = f"Search failed: {str(e)}"
                
            formatted_messages.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": tool_call.function.name,
                "content": search_results
            })
            
        # Step 3: Call again with the search results
        second_response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=formatted_messages,
            temperature=0.3,
        )
        return second_response.choices[0].message.content
        
    else:
        # It didn't need to search, just return the answer
        return response_message.content
