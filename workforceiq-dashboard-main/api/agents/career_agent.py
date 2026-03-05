"""
Career Path Agent
Uses OpenAI GPT-4o to generate personalized career roadmaps.
"""
import os
import json
from openai import AsyncOpenAI
from models.schemas import CareerResponse, CareerSkillGap, RoleMatch, Certification, CareerMilestone

_client: AsyncOpenAI | None = None

def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key or api_key in ("sk-YOUR_KEY_HERE", "YOUR_KEY_HERE"):
            raise RuntimeError("OPENAI_API_KEY is not set. Edit backend/.env.")
        _client = AsyncOpenAI(api_key=api_key)
    return _client

MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")

SYSTEM_PROMPT = """You are an AI Career Development Agent for WorkforceIQ.
Generate a personalized career plan based on the candidate's profile.

Return a valid JSON with EXACTLY this structure:
{
  "skill_gaps": [
    {"skill": "<skill name>", "current": <0-100>, "target": <0-100>},
    ... 4 items
  ],
  "role_matches": [
    {"role": "<role name>", "match": <0-100>, "timeline": "<e.g. 6-12 months>"},
    ... 3 items
  ],
  "certifications": [
    {"name": "<cert name>", "provider": "<provider>", "relevance": <0-100>},
    ... 3 items
  ],
  "timeline": [
    {"phase": "Current", "role": "<current role>", "status": "active"},
    {"phase": "6 months", "role": "<next role>", "status": "next"},
    {"phase": "12 months", "role": "<role>", "status": "future"},
    {"phase": "24 months", "role": "<role>", "status": "future"}
  ],
  "career_summary": "<2-sentence career trajectory summary>"
}

Be specific and realistic based on their actual skills and experience.
"""

async def run_career_agent(profile_data: dict) -> CareerResponse:
    profile_text = f"""
Name: {profile_data.get('name', 'Unknown')}
Role: {profile_data.get('role', 'Professional')}
Experience: {profile_data.get('experience_years', 0)} years
Skills: {', '.join(profile_data.get('skills', []))}
Education: {profile_data.get('education', 'Not specified')}
Summary: {profile_data.get('summary', '')}
"""
    response = await get_client().chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Generate career plan for:\n{profile_text}"}
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )
    data = json.loads(response.choices[0].message.content)
    return CareerResponse(
        skill_gaps=[CareerSkillGap(skill=str(s.get("skill") or ""), current=float(s.get("current") or 0), target=float(s.get("target") or 0)) for s in (data.get("skill_gaps") or [])],
        role_matches=[RoleMatch(role=str(r.get("role") or ""), match=float(r.get("match") or 0), timeline=str(r.get("timeline") or "")) for r in (data.get("role_matches") or [])],
        certifications=[Certification(name=str(c.get("name") or ""), provider=str(c.get("provider") or ""), relevance=float(c.get("relevance") or 0)) for c in (data.get("certifications") or [])],
        timeline=[CareerMilestone(phase=str(t.get("phase") or ""), role=str(t.get("role") or ""), status=str(t.get("status") or "future")) for t in (data.get("timeline") or [])],
        career_summary=str(data.get("career_summary") or ""),
    )
