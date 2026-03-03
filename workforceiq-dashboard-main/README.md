# WorkforceIQ Dashboard

WorkforceIQ is an advanced AI-powered HR and candidate management dashboard designed to streamline the hiring process and provide intelligent insights into team performance, attrition, and career development.

## Features

- **Hiring Intelligence**: Automatically parse uploaded resumes (PDF/DOCX) and evaluate candidates using OpenAI's GPT-4o model.
- **AI Agents**: Specialized agents for different HR domains:
  - *Attrition Agent*: Analyzes retention risks and provides actionable insights.
  - *Performance Agent*: Evaluates employee performance metrics.
  - *Career Agent*: Suggests career paths and development opportunities.
  - *Explainability*: Provides transparent reasoning for AI-driven hiring recommendations.
- **Secure Data Storage**: Integrated with Firebase Authentication and Firestore/Realtime Database for secure and reliable candidate data persistence.

## Tech Stack

### Frontend
- **React** (Vite)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Firebase** (Auth, Firestore)

### Backend
- **FastAPI** (Python)
- **OpenAI API** (GPT-4o for intelligent analysis)
- **PyMuPDF / python-docx** (Resume parsing)

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- Firebase Project configured
- OpenAI API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   Create a `.env` file in the `backend` directory (do not commit this file):
   ```env
   OPENAI_API_KEY=sk-your-openai-key
   OPENAI_MODEL=gpt-4o
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The API will be available at `http://localhost:8000`.

### Frontend Setup
1. From the project root, install Node dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables:
   Ensure you have your Firebase configuration set up in `.env.local` or environment variables for Vite:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_API_URL=http://localhost:8000/api
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:8080` (or `5173`).

## Project Structure
- `/src`: React frontend application code (Pages, Components, Context, API handlers).
- `/backend`: FastAPI application handles AI routing, candidate resume parsing, and intelligent evaluations using OpenAI.
