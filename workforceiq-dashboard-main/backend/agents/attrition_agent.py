"""
Attrition Risk Agent
Uses OpenAI GPT-4o to analyze employee profiles and predict attrition risk.
"""
import os
import json
from openai import AsyncOpenAI
from models.schemas import (
    AttritionRisk, AttritionSummary, AttritionResponse
)

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

SYSTEM_PROMPT = """You are an expert HR attrition risk analyst AI for WorkforceIQ.
Given the candidate's resume/profile data, analyze their attrition risk.

Return a valid JSON object with EXACTLY this structure:
{
  "employees": [
    {
      "name": "<candidate name>",
      "dept": "<inferred department/specialty from skills>",
      "risk": <number 0-100, attrition risk score>,
      "factors": ["factor 1", "factor 2", "factor 3"],
      "recommendation": "<specific HR retention action>"
    }
  ],
  "high_risk_count": <number>,
  "medium_risk_count": <number>,
  "low_risk_count": <number>,
  "summary": "<2-sentence overall assessment>"
}

Base your analysis on:
- Experience level vs typical market expectations
- Skill set breadth (more diverse = lower risk)
- Career trajectory indicators
- Industry demand for their skills
- Education and role alignment

Return exactly 1 employee entry based on the given profile.
"""

async def run_attrition_agent(profile_data: dict) -> AttritionResponse:
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
            {"role": "user", "content": f"Analyze attrition risk for:\n{profile_text}"}
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    data = json.loads(response.choices[0].message.content)
    employees = [
        AttritionRisk(
            id=str(i + 1),
            name=str(e.get("name") or "Unknown"),
            dept=str(e.get("dept") or "General"),
            risk=float(e.get("risk") or 50),
            factors=e.get("factors") or [],
            recommendation=str(e.get("recommendation") or ""),
        )
        for i, e in enumerate(data.get("employees") or [])
    ]
    return AttritionResponse(
        employees=employees,
        high_risk_count=int(data.get("high_risk_count") or 0),
        medium_risk_count=int(data.get("medium_risk_count") or 0),
        low_risk_count=int(data.get("low_risk_count") or 0),
        summary=str(data.get("summary") or ""),
    )
