"""
Agents Router — Attrition, Performance, Career, Explainability
All agents operate on profile data from analyzed candidates (stored by hiring router).
"""
from fastapi import APIRouter, HTTPException, Depends
from agents.attrition_agent import run_attrition_agent
from agents.performance_agent import run_performance_agent
from agents.career_agent import run_career_agent
from agents.explainability_agent import run_explainability_agent
from models.schemas import (
    AttritionResponse, PerformanceResponse, CareerResponse, ExplainabilityResponse
)
from services.firestore_service import db_service
from services.auth_service import verify_token
import traceback

router = APIRouter(
    prefix="/api/agents", 
    tags=["agents"],
    dependencies=[Depends(verify_token)]
)


async def _get_profile(candidate_id: str) -> dict:
    """Retrieve candidate profile."""
    from routers.hiring import _session_memory
    
    if db_service.is_ready():
        candidate = await db_service.get_candidate(candidate_id)
    else:
        candidate = _session_memory.get(candidate_id)
        
    if not candidate:
        raise HTTPException(status_code=404, detail=f"Candidate '{candidate_id}' not found. Upload a resume first.")
    return candidate.profile.model_dump()


async def _get_analysis(candidate_id: str) -> dict:
    """Retrieve full analysis."""
    from routers.hiring import _session_memory
    
    if db_service.is_ready():
        candidate = await db_service.get_candidate(candidate_id)
    else:
        candidate = _session_memory.get(candidate_id)
        
    if not candidate:
        raise HTTPException(status_code=404, detail=f"Candidate '{candidate_id}' not found.")
    return candidate.model_dump()


# ─── Attrition ────────────────────────────────────────────────────────────────

@router.post("/attrition/{candidate_id}", response_model=AttritionResponse)
async def attrition_analysis(candidate_id: str):
    """Run attrition risk analysis for an uploaded candidate."""
    try:
        profile = await _get_profile(candidate_id)
        return await run_attrition_agent(profile)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Attrition analysis failed: {str(e)}")


# ─── Performance ──────────────────────────────────────────────────────────────

@router.post("/performance/{candidate_id}", response_model=PerformanceResponse)
async def performance_analysis(candidate_id: str):
    """Run performance evaluation for an uploaded candidate."""
    try:
        profile = await _get_profile(candidate_id)
        return await run_performance_agent(profile)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Performance analysis failed: {str(e)}")


# ─── Career ───────────────────────────────────────────────────────────────────

@router.post("/career/{candidate_id}", response_model=CareerResponse)
async def career_analysis(candidate_id: str):
    """Generate career roadmap for an uploaded candidate."""
    try:
        profile = await _get_profile(candidate_id)
        return await run_career_agent(profile)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Career analysis failed: {str(e)}")


# ─── Explainability ───────────────────────────────────────────────────────────

@router.post("/explainability/{candidate_id}", response_model=ExplainabilityResponse)
async def explainability_analysis(candidate_id: str):
    """Generate model explainability and fairness audit for a candidate."""
    try:
        profile = await _get_profile(candidate_id)
        analysis = await _get_analysis(candidate_id)
        return await run_explainability_agent(profile, analysis)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Explainability analysis failed: {str(e)}")
