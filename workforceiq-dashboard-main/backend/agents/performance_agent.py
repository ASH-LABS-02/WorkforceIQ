"""
Performance Agent
Uses OpenAI GPT-4o to evaluate employee performance from resume/profile.
"""
import os
import json
from openai import AsyncOpenAI
from models.schemas import PerformanceEmployee, KPIPoint, TrendPoint, PerformanceResponse

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

SYSTEM_PROMPT = """You are an AI Performance Evaluation Agent for WorkforceIQ.
Evaluate a candidate's performance and potential based on their profile.

Return a valid JSON with EXACTLY this structure:
{
  "employee": {
    "name": "<name>",
    "dept": "<department/specialty>",
    "score": <number 0-100, overall performance score>,
    "trend": "<up|stable|down>",
    "readiness": "<Ready|Developing|Not Ready> for promotion",
    "ai_summary": "<3-sentence performance narrative>"
  },
  "kpi_data": [
    {"kpi": "Technical Skills", "value": <0-100>},
    {"kpi": "Delivery", "value": <0-100>},
    {"kpi": "Collaboration", "value": <0-100>},
    {"kpi": "Innovation", "value": <0-100>},
    {"kpi": "Reliability", "value": <0-100>}
  ],
  "trend_data": [
    {"q": "Q1 24", "score": <0-100>},
    {"q": "Q2 24", "score": <0-100>},
    {"q": "Q3 24", "score": <0-100>},
    {"q": "Q4 24", "score": <0-100>},
    {"q": "Q1 25", "score": <0-100>},
    {"q": "Q2 25", "score": <0-100>}
  ]
}

Base your analysis on skills depth, experience, education, and role fit.
Show realistic growth trajectory in trend_data.
"""

async def run_performance_agent(profile_data: dict) -> PerformanceResponse:
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
            {"role": "user", "content": f"Evaluate performance for:\n{profile_text}"}
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    data = json.loads(response.choices[0].message.content)
    emp = data.get("employee") or {}
    kpis = [KPIPoint(kpi=str(k.get("kpi") or ""), value=float(k.get("value") or 0)) for k in (data.get("kpi_data") or [])]
    trend = [TrendPoint(q=str(t.get("q") or ""), score=float(t.get("score") or 0)) for t in (data.get("trend_data") or [])]
    return PerformanceResponse(
        employee=PerformanceEmployee(
            name=str(emp.get("name") or "Unknown"),
            dept=str(emp.get("dept") or "General"),
            score=float(emp.get("score") or 75),
            trend=str(emp.get("trend") or "stable"),
            readiness=str(emp.get("readiness") or "Developing"),
            ai_summary=str(emp.get("ai_summary") or ""),
        ),
        kpi_data=kpis,
        trend_data=trend,
    )
