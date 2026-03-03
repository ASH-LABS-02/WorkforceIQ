from pydantic import BaseModel
from typing import Optional


# ─── Hiring Agent Models ──────────────────────────────────────────────────────

class RadarSkill(BaseModel):
    skill: str
    value: float

class SkillGap(BaseModel):
    skill: str
    current: float
    required: float

class CandidateProfile(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    summary: str
    skills: list[str]
    experience_years: float
    education: Optional[str] = None
    raw_text: Optional[str] = None

class HiringAnalysis(BaseModel):
    candidate_id: str
    profile: CandidateProfile
    fit_score: float
    hiring_probability: float
    skill_match: float
    bias_status: str              # "clear" | "review"
    strengths: list[str]
    skill_gaps: list[str]
    ai_explanation: str
    radar_data: list[RadarSkill]
    skill_gap_chart: list[SkillGap]
    recommendation: str           # "advance" | "hold" | "reject"

class UploadResponse(BaseModel):
    analysis: HiringAnalysis
    message: str


# ─── Attrition Agent Models ───────────────────────────────────────────────────

class AttritionRisk(BaseModel):
    id: str
    name: str
    dept: str
    risk: float                   # 0-100
    factors: list[str]
    recommendation: str

class AttritionSummary(BaseModel):
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int

class AttritionResponse(BaseModel):
    employees: list[AttritionRisk]
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    summary: str


# ─── Performance Agent Models ─────────────────────────────────────────────────

class PerformanceEmployee(BaseModel):
    name: str
    dept: str
    score: float                  # 0-100
    trend: str                    # "up" | "stable" | "down"
    readiness: str                # "Ready" | "Developing" | "Not Ready"
    ai_summary: str

class KPIPoint(BaseModel):
    kpi: str
    value: float

class TrendPoint(BaseModel):
    q: str
    score: float

class PerformanceResponse(BaseModel):
    employee: PerformanceEmployee
    kpi_data: list[KPIPoint]
    trend_data: list[TrendPoint]


# ─── Career Agent Models ──────────────────────────────────────────────────────

class CareerSkillGap(BaseModel):
    skill: str
    current: float
    target: float

class RoleMatch(BaseModel):
    role: str
    match: float
    timeline: str

class Certification(BaseModel):
    name: str
    provider: str
    relevance: float

class CareerMilestone(BaseModel):
    phase: str
    role: str
    status: str                   # "active" | "next" | "future"

class CareerResponse(BaseModel):
    skill_gaps: list[CareerSkillGap]
    role_matches: list[RoleMatch]
    certifications: list[Certification]
    timeline: list[CareerMilestone]
    career_summary: str


# ─── Explainability Agent Models ──────────────────────────────────────────────

class FeatureImportance(BaseModel):
    feature: str
    importance: float

class FairnessMetric(BaseModel):
    category: str
    disparity: float
    status: str                   # "pass" | "warning"

class ExplainabilityResponse(BaseModel):
    feature_importance: list[FeatureImportance]
    fairness_metrics: list[FairnessMetric]
    model_type: str
    training_data: str
    accuracy_metrics: str
    transparency_summary: str
