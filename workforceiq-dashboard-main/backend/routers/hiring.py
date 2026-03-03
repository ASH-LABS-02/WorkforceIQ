"""
Hiring Agent Router
API endpoints for resume upload and candidate management.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from models.schemas import HiringAnalysis, UploadResponse
from services.resume_parser import extract_text
from agents.hiring_agent import run_hiring_agent
from services.firestore_service import db_service
from services.auth_service import verify_token
from typing import Optional
import traceback

router = APIRouter(
    prefix="/api/candidates", 
    tags=["hiring"],
    dependencies=[Depends(verify_token)]
)

# Session-only fallback for when Firestore is not configured
_session_memory: dict[str, HiringAnalysis] = {}


@router.post("/upload", response_model=UploadResponse)
async def upload_resume(file: UploadFile = File(...)):
    """
    Upload a resume (PDF or DOCX) and run the full AI hiring analysis pipeline.
    Returns structured hiring analysis from OpenAI GPT-4o.
    """
    # Validate file type
    filename = file.filename or ""
    if not (filename.lower().endswith(".pdf") or filename.lower().endswith(".docx")):
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported."
        )

    # Validate file size (10MB limit)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size must be under 10MB.")

    # Reset file pointer after reading for size check
    await file.seek(0)

    try:
        # Step 1: Extract text from resume
        raw_text = await extract_text(file)
        if not raw_text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text from the resume. Please check the file.")

        # Step 2: Run AI hiring pipeline
        analysis = await run_hiring_agent(raw_text)

        # Step 3: Store in Firestore (or fallback to session memory)
        if db_service.is_ready():
            await db_service.save_candidate(analysis)
        else:
            _session_memory[analysis.candidate_id] = analysis

        return UploadResponse(
            analysis=analysis,
            message=f"Successfully analyzed resume for {analysis.profile.name}"
        )

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process resume: {str(e)}"
        )


@router.get("", response_model=list[HiringAnalysis])
async def list_candidates():
    """Return all analyzed candidates from Firestore or session memory."""
    if db_service.is_ready():
        return await db_service.get_candidates()
    return list(_session_memory.values())


@router.get("/{candidate_id}", response_model=HiringAnalysis)
async def get_candidate(candidate_id: str):
    """Return analysis for a specific candidate."""
    if db_service.is_ready():
        candidate = await db_service.get_candidate(candidate_id)
    else:
        candidate = _session_memory.get(candidate_id)
        
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return candidate


@router.delete("/{candidate_id}")
async def delete_candidate(candidate_id: str):
    """Remove a candidate from storage."""
    if db_service.is_ready():
        success = await db_service.delete_candidate(candidate_id)
        if not success:
            raise HTTPException(status_code=404, detail="Candidate not found in Firestore.")
    else:
        if candidate_id not in _session_memory:
            raise HTTPException(status_code=404, detail="Candidate not found in session memory.")
        del _session_memory[candidate_id]
        
    return {"message": "Candidate removed successfully."}


@router.delete("")
async def clear_candidates():
    """Clear all candidates from current storage."""
    if db_service.is_ready():
        # Caution: This only clears session memory if db is ready? 
        # Usually we don't allow clearing entire Firestore via simple API without auth
        return {"message": "Mass deletion disabled for Firestore for safety."}
    
    _session_memory.clear()
    return {"message": "Session candidates cleared."}
