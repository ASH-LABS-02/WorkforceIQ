"""
Explainability Agent
Uses OpenAI GPT-4o to generate SHAP-style feature importance and fairness metrics.
"""
import os
import json
from openai import AsyncOpenAI
from models.schemas import ExplainabilityResponse, FeatureImportance, FairnessMetric

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

SYSTEM_PROMPT = """You are an AI Explainability and Fairness Auditor for WorkforceIQ.
Given a candidate's profile, explain how the AI scored them and audit for bias.

Return a valid JSON with EXACTLY this structure:
{
  "feature_importance": [
    {"feature": "Years Experience", "importance": <0.0-1.0>},
    {"feature": "Skill Match", "importance": <0.0-1.0>},
    {"feature": "Education Level", "importance": <0.0-1.0>},
    {"feature": "Previous Role Fit", "importance": <0.0-1.0>},
    {"feature": "Certifications", "importance": <0.0-1.0>},
    {"feature": "Portfolio/Projects", "importance": <0.0-1.0>},
    {"feature": "Industry Experience", "importance": <0.0-1.0>}
  ],
  "fairness_metrics": [
    {"category": "Gender", "disparity": <0.0-0.15>, "status": "<pass|warning>"},
    {"category": "Ethnicity", "disparity": <0.0-0.15>, "status": "<pass|warning>"},
    {"category": "Age", "disparity": <0.0-0.15>, "status": "<pass|warning>"},
    {"category": "Disability", "disparity": <0.0-0.15>, "status": "<pass|warning>"}
  ],
  "model_type": "<describe the AI model approach used>",
  "training_data": "<describe training data basis>",
  "accuracy_metrics": "<AUC-ROC and F1 score description>",
  "transparency_summary": "<2-sentence explanation of how decision was made>"
}

Importance values must sum to approximately 1.0.
Status is "warning" if disparity > 0.07, else "pass".
"""

async def run_explainability_agent(profile_data: dict, analysis_data: dict) -> ExplainabilityResponse:
    context = f"""
Candidate: {profile_data.get('name', 'Unknown')}
Role: {profile_data.get('role', 'Professional')}
Experience: {profile_data.get('experience_years', 0)} years
Skills: {', '.join(profile_data.get('skills', []))}
Fit Score: {analysis_data.get('fit_score', 75)}
Hiring Probability: {analysis_data.get('hiring_probability', 0.7)}
Recommendation: {analysis_data.get('recommendation', 'hold')}
"""
    response = await get_client().chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Explain and audit this hiring decision:\n{context}"}
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
    )
    data = json.loads(response.choices[0].message.content)
    return ExplainabilityResponse(
        feature_importance=[FeatureImportance(feature=str(f.get("feature") or ""), importance=float(f.get("importance") or 0)) for f in (data.get("feature_importance") or [])],
        fairness_metrics=[FairnessMetric(category=str(m.get("category") or ""), disparity=float(m.get("disparity") or 0), status=str(m.get("status") or "pass")) for m in (data.get("fairness_metrics") or [])],
        model_type=str(data.get("model_type") or "GPT-4o Ensemble"),
        training_data=str(data.get("training_data") or ""),
        accuracy_metrics=str(data.get("accuracy_metrics") or ""),
        transparency_summary=str(data.get("transparency_summary") or ""),
    )
