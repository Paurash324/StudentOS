import os
import json
import logging
from typing import List, Optional
from pathlib import Path

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("studentos-backend")

# Load environment variables from backend/.env or root .env
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)
else:
    load_dotenv()

# Determine if running in production (Render, etc.)
# Production is detected when PORT env var is set (Render standard) or
# when explicitly set via STUDENTOS_ENV=production
_is_production = os.getenv("STUDENTOS_ENV", "").lower() == "production" or "PORT" in os.environ

# Get PORT from environment (Render uses $PORT, default to 8000 for local dev)
PORT = int(os.getenv("PORT", "8000"))

# CORS Configuration
# In production, restrict to specific frontend origins.
# In development, allow localhost origins.
_allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
if _is_production and _allowed_origins_str:
    # Production: use configured origins
    ALLOWED_ORIGINS = [origin.strip() for origin in _allowed_origins_str.split(",") if origin.strip()]
    logger.info(f"Production CORS enabled for: {ALLOWED_ORIGINS}")
else:
    # Development: allow localhost and common dev ports
    ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    logger.info(f"Development CORS enabled for: {ALLOWED_ORIGINS}")

app = FastAPI(
    title="StudentOS API",
    description="Backend API for StudentOS academic assistant and quiz generator powered by Groq",
    version="1.0.0"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_groq_config():
    """Get Groq configuration from environment variables.
    
    In production (Render, etc.), the API key should be set via the platform's
    environment variable configuration, not by writing to .env files.
    """
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
    if not model:
        model = "llama-3.3-70b-versatile"
    return api_key, model

def call_groq_chat(client, messages, preferred_model, response_format=None, temperature=0.6, max_tokens=2048):
    """Executes Groq chat completion with automatic fallback if the requested model is not enabled for the account."""
    kwargs = {
        "messages": messages,
        "model": preferred_model,
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    if response_format:
        kwargs["response_format"] = response_format

    try:
        completion = client.chat.completions.create(**kwargs)
        return completion, preferred_model
    except Exception as e:
        err_msg = str(e).lower()
        if "model_not_found" in err_msg or "does not exist or you do not have access" in err_msg:
            logger.warning(f"Preferred model {preferred_model} not accessible. Discovering account models...")
            # Query models available for this key
            try:
                models = [m.id for m in client.models.list().data]
                logger.info(f"Available account models: {models}")
                # Candidate priority list
                candidate_order = [
                    "openai/gpt-oss-120b",
                    "llama-3.3-70b-versatile",
                    "qwen/qwen3.8-27b",
                    "llama-3.1-8b-instant",
                    "openai/gpt-oss-20b"
                ]
                selected_fallback = None
                for candidate in candidate_order:
                    if candidate in models:
                        selected_fallback = candidate
                        break
                if not selected_fallback and models:
                    # pick first non-whisper, non-guard model
                    chat_candidates = [m for m in models if "whisper" not in m and "guard" not in m]
                    selected_fallback = chat_candidates[0] if chat_candidates else models[0]

                if selected_fallback:
                    logger.info(f"Retrying with fallback model: {selected_fallback}")
                    kwargs["model"] = selected_fallback
                    completion = client.chat.completions.create(**kwargs)
                    return completion, selected_fallback
            except Exception as inner_e:
                logger.error(f"Fallback resolution failed: {inner_e}")
        # Re-raise if not handled
        raise e

# Request & Response Models
class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: system, user, or assistant")
    content: str = Field(..., description="Content of the message")

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    subject: Optional[str] = None
    answer_style: Optional[str] = Field(default="exam_ready", description="Answer style: quick, exam_ready, or detailed")
    system_prompt: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    model: str
    answer_style: Optional[str] = "exam_ready"

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_index: int
    explanation: str

class QuizRequest(BaseModel):
    subject: str = Field(..., min_length=1)
    topic: Optional[str] = "Key concepts and high-yield exam topics"
    difficulty: Optional[str] = "Intermediate"
    num_questions: Optional[int] = Field(default=5, ge=1, le=10)

class QuizResponse(BaseModel):
    title: str
    subject: str
    topic: str
    difficulty: str
    questions: List[QuizQuestion]

# =============================================================================
# DEPRECATED ENDPOINT - Disabled for production security
# =============================================================================
# The /api/set-key endpoint allowed clients to modify the GROQ_API_KEY at runtime.
# This is insecure for production deployments and has been disabled.
#
# To update the API key in production, set the GROQ_API_KEY environment variable
# in your hosting platform's dashboard (e.g., Render Dashboard > Environment Variables).
#
# If you need this endpoint for local development only, uncomment the code below
# and ensure it is protected by authentication in production.
# =============================================================================
# 
# @app.post("/api/set-key")
# def set_api_key(req: UpdateKeyRequest):
#     new_key = req.api_key.strip()
#     if not new_key:
#         raise HTTPException(status_code=400, detail="API key cannot be empty")
#     
#     os.environ["GROQ_API_KEY"] = new_key
#     try:
#         model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
#         with open(env_path, "w", encoding="utf-8") as f:
#             f.write(f"GROQ_API_KEY={new_key}\nGROQ_MODEL={model}\n")
#     except Exception as e:
#         logger.error(f"Failed to write .env: {e}")
# 
#     return {"status": "success", "message": "Groq API key updated successfully"}


# Endpoints


@app.get("/")
@app.get("/api")
def root_info():
    """Root endpoint with API information."""
    return {
        "name": "StudentOS API",
        "version": "1.0.0",
        "description": "Backend API for StudentOS academic assistant and quiz generator powered by Groq",
        "endpoints": {
            "health": "/api/health",
            "chat": "POST /api/chat",
            "generate_quiz": "POST /api/generate-quiz"
        },
        "environment": "production" if _is_production else "development",
        "groq_configured": bool(os.getenv("GROQ_API_KEY", "").strip() and len(os.getenv("GROQ_API_KEY", "").strip()) > 5)
    }


@app.get("/api/health")
def health_check():
    """Health check endpoint for monitoring and deployment verification."""
    api_key, model = get_groq_config()
    is_configured = bool(api_key and len(api_key) > 5)
    
    # Never expose any part of the API key, even masked, in production
    response_data: dict = {
        "status": "healthy",
        "groq_configured": is_configured,
        "groq_model": model,
    }
    
    # Only include environment info in development
    if not _is_production:
        response_data["environment"] = "development"
        if is_configured and len(api_key) > 10:
            # Show masked key only in development for verification
            response_data["masked_key"] = f"{api_key[:6]}...{api_key[-4:]}"
    else:
        response_data["environment"] = "production"
    
    return response_data


@app.post("/api/chat", response_model=ChatResponse)
def academic_chat(req: ChatRequest):
    api_key, model = get_groq_config()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GROQ_API_KEY is not configured. Please set the GROQ_API_KEY environment variable in your deployment platform."
        )

    try:
        from groq import Groq
        client = Groq(api_key=api_key)
    except Exception as e:
        logger.exception("Failed to initialize Groq client")
        raise HTTPException(status_code=500, detail=f"Groq initialization error: {str(e)}")

    # Normalize and configure requested answer style
    style = (req.answer_style or "exam_ready").strip().lower()
    if style not in ("quick", "exam_ready", "detailed"):
        style = "exam_ready"

    # Style-specific instructions
    if style == "quick":
        style_instruction = (
            "ANSWER STYLE: QUICK ANSWER (CONCISE & DIRECT)\n"
            "- Length: Strictly 1 to 3 direct paragraphs. Keep it short and to the point.\n"
            "- Approach: Directly answer the question in the opening sentence. Explain key intuition and definitions without fluff.\n"
            "- Avoid: Multi-section layouts, lengthy introductory chatter, or unnecessary filler."
        )
    elif style == "exam_ready":
        style_instruction = (
            "ANSWER STYLE: EXAM READY (STRUCTURED COLLEGE-LEVEL)\n"
            "- Format: Structure as a high-scoring university examination response.\n"
            "- Section 1: Definition & Concept Scope (formal definition, fundamental theory).\n"
            "- Section 2: Key Working Mechanisms & Properties (clear numbered points 1, 2, 3).\n"
            "- Section 3: Concrete Example, Code Snippet, or Mathematical Formulation.\n"
            "- Section 4: High-Yield Exam Conclusion / Key Takeaway.\n"
            "- Formatting: Use clear headings (###) and numbered lists for rapid exam memorization."
        )
    else:  # detailed
        style_instruction = (
            "ANSWER STYLE: DETAILED EXPLANATION (STEP-BY-STEP TEACHING)\n"
            "- Approach: Comprehensive, pedagogical step-by-step masterclass.\n"
            "- 1. Conceptual Foundation & Intuition: Why this exists, fundamental problem it solves, and intuitive analogies.\n"
            "- 2. Step-by-Step Breakdown: Deep dive into the underlying algorithm, architecture, or proof step-by-step.\n"
            "- 3. Real-World Applications & Industry Context: How modern systems utilize this in production.\n"
            "- 4. Comparison & Trade-Offs: Use a Markdown comparison table to contrast alternatives or trade-offs.\n"
            "- 5. Revision Summary Checklist: High-yield bullet points summarizing the most important takeaways.\n"
            "- Formatting: Use clear headings (###), markdown comparison tables, and code/syntax blocks where applicable."
        )

    # Core academic tutor rules
    core_system = (
        "You are StudentOS AI — an elite academic tutor dedicated to university students.\n\n"
        "CORE TEACHING RULES:\n"
        "1. Student-Friendly Clarity: Explain concepts in clear, student-friendly, intellectually rigorous language.\n"
        "2. Factual Accuracy Over Length: Prioritise factual precision and correct terminology over verbose fluff.\n"
        "3. Polite Misconception Correction: If the student holds or asks about a common misconception, politely correct it and clarify the truth.\n"
        "4. No Boilerplate: Avoid conversational filler ('Sure, I would love to help you with that!'), repetitive intros/outros, and excessive emojis.\n"
        "5. Clean Formatting: Utilize markdown headings (###), bullet points, numbered lists, markdown tables, and syntax-highlighted code blocks where useful.\n"
        "6. Absolute Truthfulness: Never invent formulas, synthetic facts, or fake citations. If an equation has conditions or constraints, state them accurately.\n"
        "7. Style Adherence: Strictly follow the formatting and depth rules of the selected Answer Style."
    )

    base_system = f"{core_system}\n\n{style_instruction}"
    if req.subject and req.subject != "General Academic":
        base_system += f"\n\nCURRENT COURSE CONTEXT: {req.subject}. Anchor your terminology, curriculum depth, and problem contexts to this academic course."
    if req.system_prompt:
        base_system += f"\n\nADDITIONAL INSTRUCTION: {req.system_prompt}"

    groq_messages = [{"role": "system", "content": base_system}]
    for msg in req.messages:
        groq_messages.append({"role": msg.role, "content": msg.content})

    try:
        chat_completion, used_model = call_groq_chat(
            client=client,
            messages=groq_messages,
            preferred_model=model,
            temperature=0.5 if style == "quick" else 0.6,
            max_tokens=2048
        )
        reply = chat_completion.choices[0].message.content or "No response generated."
        return ChatResponse(reply=reply, model=used_model, answer_style=style)
    except Exception as e:
        logger.exception("Groq Chat completion failed")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Groq API error: {str(e)}")

@app.post("/api/generate-quiz", response_model=QuizResponse)
def generate_quiz(req: QuizRequest):
    api_key, model = get_groq_config()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GROQ_API_KEY is not configured. Please set the GROQ_API_KEY environment variable in your deployment platform."
        )

    try:
        from groq import Groq
        client = Groq(api_key=api_key)
    except Exception as e:
        logger.exception("Failed to initialize Groq client")
        raise HTTPException(status_code=500, detail=f"Groq initialization error: {str(e)}")

    prompt = (
        f"Generate a challenging, high-yield academic multiple-choice quiz for college students.\n"
        f"Subject: {req.subject}\n"
        f"Specific Topic/Focus: {req.topic or 'Core curriculum and fundamental concepts'}\n"
        f"Difficulty Level: {req.difficulty or 'Intermediate'}\n"
        f"Total Questions: {req.num_questions}\n\n"
        f"CRITICAL REQUIREMENTS:\n"
        f"1. You MUST return ONLY a valid JSON object matching the exact schema below.\n"
        f"2. Each question MUST have exactly 4 choices in 'options'.\n"
        f"3. 'correct_index' MUST be an integer between 0 and 3 corresponding to the correct option index.\n"
        f"4. 'explanation' MUST be a clear, pedagogical breakdown of why the answer is correct and why the alternatives are incorrect.\n\n"
        f"Required JSON schema:\n"
        f"{{\n"
        f'  "title": "{req.subject} - {req.topic or "Review Quiz"}",\n'
        f'  "subject": "{req.subject}",\n'
        f'  "topic": "{req.topic or "Comprehensive"}",\n'
        f'  "difficulty": "{req.difficulty or "Intermediate"}",\n'
        f'  "questions": [\n'
        f"    {{\n"
        f'      "id": 1,\n'
        f'      "question": "Question text here?",\n'
        f'      "options": ["Option A", "Option B", "Option C", "Option D"],\n'
        f'      "correct_index": 0,\n'
        f'      "explanation": "Detailed explanation here."\n'
        f"    }}\n"
        f"  ]\n"
        f"}}"
    )

    try:
        completion, used_model = call_groq_chat(
            client=client,
            messages=[
                {"role": "system", "content": "You are an expert university examiner. You always output strictly valid JSON."},
                {"role": "user", "content": prompt}
            ],
            preferred_model=model,
            temperature=0.4,
            response_format={"type": "json_object"}
        )

        content = completion.choices[0].message.content
        if not content:
            raise ValueError("Empty response received from AI model")

        parsed_data = json.loads(content)

        if "quiz" in parsed_data and isinstance(parsed_data["quiz"], dict):
            parsed_data = parsed_data["quiz"]

        parsed_data.setdefault("title", f"{req.subject} Quiz")
        parsed_data.setdefault("subject", req.subject)
        parsed_data.setdefault("topic", req.topic or "General")
        parsed_data.setdefault("difficulty", req.difficulty or "Intermediate")
        
        raw_questions = parsed_data.get("questions", [])
        if not isinstance(raw_questions, list) or len(raw_questions) == 0:
            raise ValueError("AI did not produce any questions in the questions array.")

        validated_questions = []
        for i, q in enumerate(raw_questions):
            q_id = q.get("id", i + 1)
            q_text = str(q.get("question", f"Question {i+1}")).strip()
            opts = q.get("options", [])
            if not isinstance(opts, list) or len(opts) < 2:
                opts = ["Option A", "Option B", "Option C", "Option D"]
            elif len(opts) < 4:
                while len(opts) < 4:
                    opts.append(f"Option {len(opts)+1}")
            elif len(opts) > 4:
                opts = opts[:4]

            correct_idx = q.get("correct_index", 0)
            if not isinstance(correct_idx, int) or correct_idx < 0 or correct_idx >= len(opts):
                correct_idx = 0

            expl = str(q.get("explanation", "Correct choice identified based on standard academic curriculum.")).strip()

            validated_questions.append(
                QuizQuestion(
                    id=q_id,
                    question=q_text,
                    options=[str(o) for o in opts],
                    correct_index=correct_idx,
                    explanation=expl
                )
            )

        return QuizResponse(
            title=parsed_data.get("title", f"{req.subject} Quiz"),
            subject=parsed_data.get("subject", req.subject),
            topic=parsed_data.get("topic", req.topic or "Core Topics"),
            difficulty=parsed_data.get("difficulty", req.difficulty or "Intermediate"),
            questions=validated_questions
        )

    except json.JSONDecodeError as jde:
        logger.error(f"JSON decode failed: {jde}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Invalid JSON returned from AI provider: {str(jde)}"
        )
    except Exception as e:
        logger.exception("Quiz generation error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate quiz: {str(e)}"
        )
