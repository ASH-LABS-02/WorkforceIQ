"""
Hiring Intelligent Agent
Uses OpenAI GPT-4o to parse resumes and generate comprehensive hiring analysis.
"""
import os
import json
import uuid
from openai import AsyncOpenAI
from models.schemas import CandidateProfile, HiringAnalysis, RadarSkill, SkillGap


# Lazy-initialize so the key is only checked when an actual API call is made
_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key or api_key in ("sk-YOUR_KEY_HERE", "YOUR_KEY_HERE"):
            raise RuntimeError(
                "OPENAI_API_KEY is not set. "
                "Edit backend/.env and add your real OpenAI API key."
            )
        _client = AsyncOpenAI(api_key=api_key)
    return _client


MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")


UNIFIED_SYSTEM_PROMPT = """You are an advanced AI Hiring Intelligence Agent for WorkforceIQ.
Your role: Extract structured information from the given resume AND provide a detailed, unbiased hiring analysis.

You must return a valid JSON object with EXACTLY these fields:
{
  "profile": {
    "name": "Full Name",
    "email": "email@example.com or null",
    "phone": "phone number or null",
    "role": "most recent or target job title",
    "summary": "2-3 sentence professional summary",
    "skills": ["skill1", "skill2", ...],
    "experience_years": 3.5,
    "education": "Highest degree/university"
  },
  "analysis": {
    "fit_score": <number 0-100>,
    "hiring_probability": <0.0-1.0>,
    "skill_match": <0-100>,
    "bias_status": "clear" | "review",
    "strengths": ["string", ...],
    "skill_gaps": ["string", ...],
    "ai_explanation": "3-4 sentence paragraph summary",
    "recommendation": "advance" | "hold" | "reject",
    "radar_data": [
      {"skill": "Technical Skills", "value": <0-100>},
      {"skill": "Communication", "value": <0-100>},
      {"skill": "Leadership", "value": <0-100>},
      {"skill": "Problem Solving", "value": <0-100>},
      {"skill": "Domain Knowledge", "value": <0-100>},
      {"skill": "Adaptability", "value": <0-100>}
    ],
    "skill_gap_chart": [
      {"skill": "skill name", "current": <0-100>, "required": <0-100>},
      ...up to 5 items
    ]
  }
}

Be precise, objective, and efficient. Do not hallucinate."""


async def run_hiring_agent(raw_text: str) -> HiringAnalysis:
    """
    Optimized hiring agent pipeline: 
    Extracts profile and runs analysis in a single GPT-4o call (One-Shot).
    """
    # Step 1: Call GPT-4o once for everything
    response = await get_client().chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": UNIFIED_SYSTEM_PROMPT},
            {"role": "user", "content": f"Resume text:\n\n{raw_text[:10000]}"}
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
    )

    full_data = json.loads(response.choices[0].message.content)
    p_data = full_data.get("profile", {})
    a_data = full_data.get("analysis", {})

    # Step 2: Build profile object
    profile = CandidateProfile(
        name=p_data.get("name") or "Unknown Candidate",
        email=p_data.get("email") or None,
        phone=p_data.get("phone") or None,
        role=p_data.get("role") or "Professional",
        summary=p_data.get("summary") or "",
        skills=p_data.get("skills") or [],
        experience_years=float(p_data.get("experience_years") or 0),
        education=p_data.get("education") or None,
        raw_text=raw_text[:2000], 
    )

    # Step 3: Build radar and gap data
    radar_data = [
        RadarSkill(skill=str(item.get("skill", "")), value=float(item.get("value") or 0))
        for item in (a_data.get("radar_data") or [])
        if item.get("skill")
    ]

    skill_gap_chart = [
        SkillGap(
            skill=str(item.get("skill", "")),
            current=float(item.get("current") or 0),
            required=float(item.get("required") or 0),
        )
        for item in (a_data.get("skill_gap_chart") or [])
        if item.get("skill")
    ]

    # Step 4: Return consolidated analysis
    return HiringAnalysis(
        candidate_id=str(uuid.uuid4()),
        profile=profile,
        fit_score=float(a_data.get("fit_score") or 75),
        hiring_probability=float(a_data.get("hiring_probability") or 0.7),
        skill_match=float(a_data.get("skill_match") or 70),
        bias_status=a_data.get("bias_status") or "clear",
        strengths=a_data.get("strengths") or [],
        skill_gaps=a_data.get("skill_gaps") or [],
        ai_explanation=a_data.get("ai_explanation") or "",
        radar_data=radar_data,
        skill_gap_chart=skill_gap_chart,
        recommendation=a_data.get("recommendation") or "hold",
    )
