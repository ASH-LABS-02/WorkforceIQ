# WorkforceIQ Backend — Hiring Intelligent Agent

Python/FastAPI backend powered by **OpenAI GPT-4o** for real-time resume analysis and hiring intelligence.

## Setup

### 1. Add Your OpenAI API Key

Edit `backend/.env` and replace the placeholder.

### 2. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Start the Backend
```bash
# Option A: Direct uvicorn
uvicorn main:app --reload --port 8000

# Option B: Using the run script
python run.py
```

The backend will be available at **http://localhost:8000**  
Swagger API docs: **http://localhost:8000/docs**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/candidates/upload` | Upload PDF/DOCX resume → GPT-4o analysis |
| `GET` | `/api/candidates` | List all analyzed candidates |
| `GET` | `/api/candidates/{id}` | Get specific candidate analysis |
| `DELETE` | `/api/candidates/{id}` | Remove a candidate |
| `GET` | `/health` | Health check (confirms API key status) |

---

## AI Pipeline

When a resume is uploaded, the agent runs this pipeline:

1. **File Validation** — Checks file type (PDF/DOCX) and size (≤ 10MB)
2. **Resume Parsing** — PyMuPDF / python-docx extracts raw text
3. **Skill Extraction** — GPT-4o extracts structured profile (name, role, skills, experience)
4. **Feature Engineering** — Normalizes data for evaluation
5. **Hiring Model Evaluation** — GPT-4o generates fit score, hiring probability, skill match
6. **Bias Check** — GPT-4o reviews for protected category signals
7. **Explainability Generation** — AI narrative explaining the recommendation
8. **Final Scoring** — Returns complete `HiringAnalysis` JSON

---

## Frontend

The React frontend (`npm run dev`) auto-connects at:
- **Resume Upload** page: Uploads to `POST /api/candidates/upload`
- **Hiring Intelligence** page: Reads from `GET /api/candidates`

The Vite dev proxy routes `/api/*` → `http://localhost:8000` automatically.
