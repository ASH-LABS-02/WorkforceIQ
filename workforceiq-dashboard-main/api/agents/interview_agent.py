"""
AI Interview Agent
Generates customized technical and behavioral interview questions based on candidate skills.
"""
import os
import json
from openai import AsyncOpenAI
from models.schemas import InterviewResponse, InterviewQuestion

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-4o")

async def run_interview_agent(profile: dict) -> InterviewResponse:
    skills = profile.get("skills", [])
    role = profile.get("role", "Professional")
    experience = profile.get("experience_years", 0)

    system_prompt = (
        "You are an expert technical interviewer and HR technical recruiter.\n"
        "Your task is to generate customized interview questions for a candidate based strictly "
        "on the skills listed in their resume.\n\n"
        "Return the output as a clean JSON object adhering to this schema:\n"
        "{\n"
        '  "questions": [\n'
        '    {\n'
        '      "question": "A specific technical or behavioral question.",\n'
        '      "difficulty": "Easy" | "Medium" | "Hard",\n'
        '      "topic": "The specific skill or topic being assessed.",\n'
        '      "hint": "A brief hint or key point the candidate should include in their answer."\n'
        '    }\n'
        "  ],\n"
        '  "overall_advice": "A brief paragraph of overall interview advice for this candidate based on their profile."\n'
        "}\n\n"
        "Produce 5-7 distinct questions that vary in difficulty. Focus heavily on their listed skills."
    )

    user_prompt = f"""
Candidate Role: {role}
Years of Experience: {experience}
Candidate Skills: {', '.join(skills) if skills else 'General skills'}

Generate the interview questions now.
"""

    response = await client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
    )

    raw_json = response.choices[0].message.content
    data = json.loads(raw_json)

    # Validate with Pydantic
    return InterviewResponse(**data)
