"""
WorkforceIQ Backend — FastAPI Application
Hiring Intelligent Agent powered by OpenAI GPT-4o
"""
import os
import sys

# Ensure the api/ directory itself is on the path so sub-modules resolve correctly
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv

# Load environment variables FIRST before importing any routers which might evaluate env vars
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import hiring, agents

app = FastAPI(
    title="WorkforceIQ Hiring Agent API",
    description="AI-powered hiring intelligence using OpenAI GPT-4o for resume analysis and candidate evaluation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
    os.getenv("FRONTEND_URL_ALT", "http://localhost:8080"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(hiring.router)
app.include_router(agents.router)



# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
async def health():
    api_key_set = bool(os.getenv("OPENAI_API_KEY", "").startswith("sk-"))
    return {
        "status": "healthy",
        "openai_configured": api_key_set,
        "model": os.getenv("OPENAI_MODEL", "gpt-4o"),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True,
    )
