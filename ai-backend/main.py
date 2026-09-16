"""
Syllo AI Backend — FastAPI Application

Endpoints:
  POST /v1/process    → Queue a document for ingestion (extract → chunk → embed)
  POST /v1/generate   → Generate a quiz from a processed document via RAG + Gemini
  GET  /v1/status/{id}→ Check Celery task status
  GET  /health        → Health check
"""

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from config import settings
import shutil
import uuid
import os

app = FastAPI(
    title="Syllo AI Engine",
    version="1.0.0",
    description="Backend service for document processing and AI quiz generation",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount outputs directory for static file serving
os.makedirs("outputs", exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# Ensure temp uploads directory exists
TEMP_DIR = os.path.join(os.getcwd(), 'temp_uploads')
os.makedirs(TEMP_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class ProcessRequest(BaseModel):
    workspace_id: str
    file_url: str


class GenerateRequest(BaseModel):
    workspace_id: str
    topic: str
    difficulty: str = Field(default="Intermediate", pattern="^(Beginner|Intermediate|Advanced)$")
    question_count: int = Field(default=5, ge=1, le=20)


class ProcessResponse(BaseModel):
    status: str
    task_id: str


class UploadResponse(BaseModel):
    status: str
    file_path: str


class GenerateResponse(BaseModel):
    status: str
    quiz: dict


class TaskStatusResponse(BaseModel):
    task_id: str
    state: str
    phase: str | None = None
    result: dict | None = None
    error: str | None = None


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    workspace_id: str
    messages: list[ChatMessage]


class ChatResponse(BaseModel):
    status: str
    reply: str


class GenerateFlashcardsRequest(BaseModel):
    workspace_id: str
    topic: str
    count: int = Field(default=10, ge=1, le=50)


class GenerateFlashcardsResponse(BaseModel):
    status: str
    flashcards: dict


# ---------------------------------------------------------------------------
# Models for Summary Generation
# ---------------------------------------------------------------------------
class GenerateSummaryRequest(BaseModel):
    workspace_id: str
    topic: str
    length: str = "medium"


class GenerateSummaryResponse(BaseModel):
    status: str
    summary: str


# ---------------------------------------------------------------------------
# Models for Voice and Report Generation
# ---------------------------------------------------------------------------
class GenerateVoiceRequest(BaseModel):
    workspace_id: str
    topic: str
    language: str = "English"


class GenerateVoiceResponse(BaseModel):
    status: str
    audio_url: str


class GenerateReportRequest(BaseModel):
    workspace_id: str
    topic: str
    format_type: str = "Briefing Doc"


class GenerateReportResponse(BaseModel):
    status: str
    pdf_url: str
    format_type: str


# ---------------------------------------------------------------------------

class GenerateStudyGuideRequest(BaseModel):
    workspace_id: str
    topic: str
    
class GenerateStudyGuideResponse(BaseModel):
    status: str
    study_guide: str

# API Endpoints
# ---------------------------------------------------------------------------


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "syllo-ai-engine"}


@app.post("/v1/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Receive a file uploaded from Vercel and save it to Render's disk."""
    try:
        # Generate unique filename to avoid collisions
        ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
        
        # Security Guard 1: Must be a supported document type
        if ext not in [".pdf", ".docx", ".pptx"]:
            raise HTTPException(status_code=400, detail="Only PDF, DOCX, and PPTX files are allowed.")
            
        # Security Guard 2: Must be under 20MB
        if file.size and file.size > 20 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File exceeds the 20MB size limit.")
            
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(TEMP_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return UploadResponse(status="success", file_path=file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        file.file.close()


@app.post("/v1/process", response_model=ProcessResponse)
async def process_document(request: ProcessRequest, background_tasks: BackgroundTasks):
    """Queue a document for the full ingestion pipeline using FastAPI BackgroundTasks."""
    from background import process_document_background

    background_tasks.add_task(process_document_background, request.workspace_id, request.file_url)
    return ProcessResponse(status="queued", task_id=request.workspace_id)


@app.get("/v1/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """Fallback status endpoint. Actual status is polled from MongoDB by Next.js."""
    return TaskStatusResponse(
        task_id=task_id,
        state="SUCCESS",
        phase="READY",
        result=None,
        error=None,
    )


@app.post("/v1/generate", response_model=GenerateResponse)
async def generate_quiz(request: GenerateRequest):
    """
    Generate a quiz by:
      1. Retrieving the most relevant chunks via RAG
      2. Sending the context to Gemini for quiz generation
    """
    from services.rag_service import retrieve_relevant_chunks
    from services.quiz_service import generate_quiz as gen_quiz
    from database import save_quiz

    try:
        # Step 1: RAG retrieval
        context = retrieve_relevant_chunks(
            workspace_id=request.workspace_id,
            query=request.topic,
            top_k=10,
        )

        # Step 2: Gemini generation
        quiz_data = gen_quiz(
            context=context,
            topic=request.topic,
            difficulty=request.difficulty,
            question_count=request.question_count,
        )

        # Step 3: Persist to MongoDB
        quiz_record = {
            "workspaceId": request.workspace_id,
            "topic": request.topic,
            "difficulty": request.difficulty,
            "questionCount": request.question_count,
            "result": quiz_data,
        }
        quiz_id = save_quiz(quiz_record)
        quiz_data["quiz_id"] = quiz_id

        return GenerateResponse(status="success", quiz=quiz_data)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/generate-flashcards", response_model=GenerateFlashcardsResponse)
async def generate_flashcards_route(request: GenerateFlashcardsRequest):
    """
    Generate flashcards from the document chunks.
    """
    from services.rag_service import retrieve_relevant_chunks
    from services.flashcard_service import generate_flashcards

    try:
        # Step 1: RAG retrieval
        context = retrieve_relevant_chunks(
            workspace_id=request.workspace_id,
            query=request.topic,
            top_k=10,
        )

        # Step 2: Gemini generation
        flashcards_data = generate_flashcards(
            context=context,
            topic=request.topic,
            count=request.count,
        )

        return GenerateFlashcardsResponse(status="success", flashcards=flashcards_data)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/chat", response_model=ChatResponse)
async def chat_route(request: ChatRequest):
    """
    Chat using Agentic RAG with Groq tool calling.
    """
    from services.chat_service import generate_chat_response

    try:
        if not request.messages:
            raise ValueError("Messages list cannot be empty")

        messages_dict = [{"role": m.role, "content": m.content} for m in request.messages]
        
        reply = generate_chat_response(
            workspace_id=request.workspace_id,
            messages=messages_dict,
        )

        return ChatResponse(status="success", reply=reply)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/generate-summary", response_model=GenerateSummaryResponse)
async def generate_summary_route(request: GenerateSummaryRequest):
    """
    Generate a summary based on document topic.
    """
    from services.rag_service import retrieve_relevant_chunks
    from services.summary_service import generate_summary

    try:
        # Step 1: RAG retrieval
        context = retrieve_relevant_chunks(
            workspace_id=request.workspace_id,
            query=request.topic,
            top_k=15, # more chunks for better summary
        )

        # Step 2: Groq summary generation
        summary = generate_summary(
            context=context,
            topic=request.topic,
            length=request.length,
        )

        return GenerateSummaryResponse(status="success", summary=summary)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------


@app.post("/v1/generate-voice", response_model=GenerateVoiceResponse)
async def generate_voice_route(request: GenerateVoiceRequest):
    """
    Generate a voice summary using edge-tts.
    """
    from services.rag_service import retrieve_relevant_chunks
    from services.voice_service import generate_voice_summary

    try:
        context = retrieve_relevant_chunks(
            workspace_id=request.workspace_id,
            query=request.topic,
            top_k=10,
        )

        audio_url = await generate_voice_summary(
            context=context,
            topic=request.topic,
            language=request.language,
        )

        return GenerateVoiceResponse(status="success", audio_url=audio_url)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/generate-report", response_model=GenerateReportResponse)
async def generate_report_route(request: GenerateReportRequest):
    """
    Generate a formatted PDF report using fpdf2.
    """
    from services.rag_service import retrieve_relevant_chunks
    from services.report_service import generate_pdf_report

    try:
        context = retrieve_relevant_chunks(
            workspace_id=request.workspace_id,
            query=request.topic,
            top_k=15,
        )

        pdf_url = generate_pdf_report(
            context=context,
            topic=request.topic,
            format_type=request.format_type,
        )

        return GenerateReportResponse(status="success", pdf_url=pdf_url, format_type=request.format_type)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class GenerateMindMapRequest(BaseModel):
    workspace_id: str
    topic: str

class GenerateMindMapResponse(BaseModel):
    status: str
    mindmap: dict

@app.post("/v1/generate-mindmap", response_model=GenerateMindMapResponse)
async def generate_mindmap_route(request: GenerateMindMapRequest):
    """
    Generate a mind map JSON from the document.
    """
    from services.rag_service import retrieve_relevant_chunks
    from services.mindmap_service import generate_mindmap_data

    try:
        context = retrieve_relevant_chunks(
            workspace_id=request.workspace_id,
            query=request.topic,
            top_k=10,
        )

        data = generate_mindmap_data(
            context=context,
            topic=request.topic,
        )

        return GenerateMindMapResponse(status="success", mindmap=data)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------

@app.post("/v1/generate-study-guide", response_model=GenerateStudyGuideResponse)
async def generate_study_guide_route(request: GenerateStudyGuideRequest):
    """
    Generate a comprehensive study guide.
    """
    from services.rag_service import retrieve_relevant_chunks
    from services.study_guide_service import generate_study_guide

    try:
        context = retrieve_relevant_chunks(
            workspace_id=request.workspace_id,
            query=request.topic,
            top_k=20, # Pull a LOT of context
        )
        guide = generate_study_guide(context, request.topic)
        return GenerateStudyGuideResponse(status="success", study_guide=guide)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class GenerateStudyPlanRequest(BaseModel):
    workspace_id: str
    topic: str

class GenerateStudyPlanResponse(BaseModel):
    status: str
    study_plan: str

@app.post("/v1/generate-studyplan", response_model=GenerateStudyPlanResponse)
async def generate_study_plan_route(request: GenerateStudyPlanRequest):
    """
    Generate a day-by-day study schedule.
    """
    from services.rag_service import retrieve_relevant_chunks
    from services.study_plan_service import generate_study_plan

    try:
        context = retrieve_relevant_chunks(
            workspace_id=request.workspace_id,
            query=request.topic,
            top_k=20, # Pull a LOT of context
        )
        plan = generate_study_plan(context, request.topic)
        return GenerateStudyPlanResponse(status="success", study_plan=plan)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run with: uvicorn main:app --reload --port 7860
# ---------------------------------------------------------------------------
