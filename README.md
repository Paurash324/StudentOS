# StudentOS — Academic Excellence & AI Study Suite

> A modern, AI-powered academic workspace designed for college students to manage coursework, prioritize revision through dynamic pedagogical weighting, auto-sequence daily study blocks, and leverage Groq ultra-low-latency AI for 24/7 academic tutoring and exam quiz diagnostics.

---

## 🌟 Key Features

1. **Academic Dashboard**
   - Live metrics: Enrolled courses, total credits, urgency index, study hours logged vs semester targets, and average confidence rating.
   - Upcoming exams timeline with dynamic countdown badges (*Critical*, *High*, *Standard*).
   - Weekly study velocity chart powered by Recharts.
   - Today's focus queue with interactive completion tracking.

2. **Course & Subject Hub**
   - Full CRUD: Add, edit, and delete enrolled college courses.
   - Comprehensive parameters: Course code, name, credits (1–6), syllabus topics, difficulty rating (1–5), confidence rating (1–5), exam date, target semester hours, and color tags.
   - Multi-criteria filtering (search by code/title/topic, filter by difficulty, sort by priority, exam date, or name).

3. **Pedagogical Priority Engine**
   - Mathematical ranking formula that removes guesswork from study planning:
     $$\text{Priority} = (0.35 \times \text{Urgency}) + (0.30 \times \text{Confidence Deficit}) + (0.20 \times \text{Difficulty}) + (0.15 \times \text{Credit Weight})$$
   - Categorizes subjects into actionable tiers: *Critical Focus* ($\ge 75$), *High Priority* ($60-74$), *Moderate*, and *Maintained*.
   - Interactive breakdown cards showing factor contributions and specific recommendations.
   - Recharts horizontal priority distribution comparison chart.

4. **Smart Daily Planner & Live Focus Timer**
   - Auto-allocates available study hours (1–8h) into realistic study sessions and structured rest breaks.
   - Higher-priority subjects automatically receive priority block sequencing.
   - Interactive timeline: Check off completed blocks with dynamic progress visualization.
   - Live Study Timer with Pomodoro (25m), Deep Focus (45m), and Break (15m) modes.
   - **Log Time to Course**: Completed timer sessions update course study hours and weekly velocity metrics in `localStorage`.

5. **AI Academic Tutor (Groq Powered)**
   - High-speed, low-latency reasoning powered by the official Groq Python SDK.
   - **Answer Style Selector**:
     - ⚡ **Quick Answer**: Concise, direct explanations in 1–3 focused paragraphs without introductory fluff.
     - 📄 **Exam Ready**: Structured college-level format with formal definitions, numbered mechanisms, concrete examples/code, and exam takeaways.
     - 🎓 **Detailed Explanation**: Comprehensive pedagogical masterclass with conceptual foundations, step-by-step algorithms, real-world industry applications, comparison tables, and revision summary checklists.
   - **Enhanced Markdown & Code Rendering**: Full support for responsive Markdown tables, syntax-highlighted code blocks with one-click copy, bulleted/numbered lists, and bold text.
   - Subject-grounded context dropdown to focus the tutor on specific course syllabi.
   - Fast exam revision, concept breakdowns, step-by-step problem explanations, and mnemonics.
   - "Generate Quiz from Topic" action directly converts conversation topics into diagnostic quizzes.

6. **AI Diagnostic Quiz Generator (Groq Powered)**
   - Generates exam-standard multiple-choice questions (3, 5, or 10 questions) tailored to selected courses and topics.
   - Configurable difficulty: *Beginner*, *Intermediate*, or *Advanced*.
   - Interactive quiz player with real-time progress tracking.
   - Detailed pedagogical review: displays user answers vs correct answers with thorough conceptual explanations.
   - Direct handoff to AI Tutor to review questions answered incorrectly.

7. **Persistence & Demo Readiness**
   - All subjects, daily schedules, preferences, study hours, and quiz records persist across browser reloads via `localStorage`.
   - Pre-loaded with realistic college demo data (*Distributed Systems*, *Database Management Systems*, *Compiler Design*, *Computer Networks*, *Linear Algebra*).
   - One-click **Demo Data** reset in the navigation bar.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Recharts.
- **Backend**: Python 3.10+ / 3.14+, FastAPI, Uvicorn, Pydantic, Python-Dotenv.
- **AI Engine**: Groq API via the official `groq` Python SDK.
- **Persistence**: Browser `localStorage` (no external database server or Supabase required).
- **Theme**: Light-theme aesthetic inspired by Google AI Studio.

---

## 🚀 Exact Windows Startup Instructions

### Option A: One-Click Windows Launch (Recommended)

Simply double-click:
- **`start_all.bat`**: Launches both Backend and Frontend in separate windows and automatically opens `http://127.0.0.1:5173/` in your default browser.

Or run individually:
- **`start_backend.bat`**: Starts the FastAPI backend with virtualenv on port 8000.
- **`start_frontend.bat`**: Starts the Vite development server on port 5173.

---

### Option B: Manual Terminal Launch

Open two PowerShell terminals in the project root: `C:\Users\jhapa\OneDrive\Desktop\StudentOS\StudentOS`.

### 1. Terminal 1: Backend Setup & Launch (FastAPI)

```powershell
# Navigate to the backend directory
cd backend

# If the virtual environment is not already created, run:
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r requirements.txt

# Configure your Groq API key in backend/.env:
# GROQ_API_KEY=gsk_your_groq_api_key_here
# GROQ_MODEL=openai/gpt-oss-120b

# Start the FastAPI backend server on port 8000
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The backend API will be live at: `http://127.0.0.1:8000`  
Swagger API Docs available at: `http://127.0.0.1:8000/docs`

---

### 2. Terminal 2: Frontend Setup & Launch (Vite + React)

```powershell
# Navigate to the frontend directory
cd frontend

# Install frontend dependencies (if not already installed)
npm install

# Start the Vite development server
npm run dev
```

Open your browser and navigate to:  
👉 **`http://127.0.0.1:5173/`**

---

## 🔑 Backend API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` or `/api` | API information and status overview. |
| `GET` | `/api/health` | Returns backend health, Groq key configuration status, and active model. |
| `POST` | `/api/chat` | Academic AI chat with subject context grounding via Groq. |
| `POST` | `/api/generate-quiz` | Generates structured JSON multiple choice questions with explanations. |

> **Note**: The `/api/set-key` endpoint has been disabled for production security. To update the API key, set the `GROQ_API_KEY` environment variable in your deployment platform's dashboard.

---

## 🌐 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    React + Vite Frontend                 │  │
│  │  - Dashboard, Subjects, Planner, AI Assistant, Quiz     │  │
│  │  - localStorage for persistence                          │  │
│  └────────────┬───────────────────────────────────┬─────────┘  │
│               │                                   │            │
│               │ HTTPS                             │ /api/*     │
│               ▼                                   ▼            │
└───────────────┼───────────────────────────────────┼─────────────┘
                │                                   │
                │                                   │
┌───────────────┼───────────────────────────────────┼─────────────┐
│  Render Cloud │                                   │             │
│  ┌────────────▼────────────┐    ┌─────────────────▼───────────┐ │
│  │   Frontend Static Site  │    │      Backend Web Service    │ │
│  │   (React build output)  │◄───┤      (FastAPI + Groq)      │ │
│  │   - Serves index.html   │    │  - AI chat endpoint         │ │
│  │   - Serves JS/CSS assets│    │  - Quiz generation endpoint │ │
│  │                         │    │  - CORS protected           │ │
│  └─────────────────────────┘    └─────────────────────────────┘ │
│                                                                  │
│  Environment Variables:                                          │
│    - VITE_API_BASE_URL → Backend URL (embedded at build time)   │
│                                                                  │
│                          ┌───────────────┐                       │
│                          │   Groq Cloud  │                       │
│                          │  (AI Models)  │                       │
│                          └───────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Frontend (Static Site)**: Built with Vite, served as static files. Makes API calls to the backend.
2. **Backend (Web Service)**: FastAPI server handles AI requests via Groq API. Never exposes API keys to the client.
3. **Persistence**: All user data is stored in the browser's `localStorage` - no server-side database required.

---

## 📦 Environment Variables

### Backend (`backend/.env` or Render Environment Variables)

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `GROQ_API_KEY` | **Yes** | - | Your Groq API key from [console.groq.com](https://console.groq.com/keys) |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Groq model to use for AI responses |
| `ALLOWED_ORIGINS` | No (dev) / **Yes** (prod) | `localhost` origins | Comma-separated list of allowed CORS origins |
| `PORT` | No (Render sets this) | `8000` | Port to run the server on |
| `STUDENTOS_ENV` | No | - | Set to `production` to enable production mode |

### Frontend (`frontend/.env` or Render Environment Variables)

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** (prod) / No (dev) | - | URL of the deployed backend service. Leave unset for local development. |

---

## 🚀 Deployment

### Prerequisites

1. **GitHub Account**: Push your code to a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Groq API Key**: Get your free API key at [console.groq.com](https://console.groq.com/keys)

---

### Option A: Automated Deployment with Render Blueprint

This project includes a `render.yaml` Blueprint file for automated deployment.

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: StudentOS academic suite"
   # Create a repository on GitHub and push
   git remote add origin https://github.com/your-username/studentos.git
   git push -u origin main
   ```

2. **Connect to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will detect `render.yaml` and create the services

3. **Configure Environment Variables**
   - In Render Dashboard, go to the backend service
   - Add environment variable: `GROQ_API_KEY` = your Groq API key
   - Add environment variable: `ALLOWED_ORIGINS` = your frontend URL (after deployment)

4. **Update Frontend Configuration**
   - After backend is deployed, copy its URL (e.g., `https://studentos-backend.onrender.com`)
   - Update frontend service environment variable: `VITE_API_BASE_URL` = backend URL
   - Redeploy the frontend

5. **Update Backend CORS**
   - Set `ALLOWED_ORIGINS` to your frontend URL (e.g., `https://studentos.onrender.com`)
   - Redeploy the backend

---

### Option B: Manual Deployment on Render

#### Backend Service

1. In Render Dashboard, click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `studentos-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `GROQ_API_KEY`: your Groq API key
     - `GROQ_MODEL`: `llama-3.3-70b-versatile` (optional)
     - `ALLOWED_ORIGINS`: your frontend URL (after frontend is deployed)

#### Frontend Static Site

1. In Render Dashboard, click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `studentos-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_BASE_URL`: your backend URL (e.g., `https://studentos-backend.onrender.com`)

---

### Deployment Order

For proper CORS configuration, deploy in this order:

1. **Deploy Backend first** - Get the backend URL
2. **Configure Frontend** - Set `VITE_API_BASE_URL` to backend URL
3. **Deploy Frontend** - Get the frontend URL
4. **Update Backend CORS** - Set `ALLOWED_ORIGINS` to frontend URL
5. **Redeploy Backend** - Apply CORS changes

---

## 🛡️ Security & Constraints

- **No Secrets in Frontend**: `GROQ_API_KEY` is kept exclusively on the FastAPI backend and never transmitted to client code.
- **Strict Validation**: All AI-generated quiz payloads are validated via Pydantic schemas before returning to the frontend.
- **CORS Protection**: Backend restricts cross-origin requests to configured frontend domains in production.
- **API Key Management**: The `/api/set-key` endpoint has been disabled. API keys must be configured via deployment platform environment variables.
- **Zero Authentication / Server Database Overhead**: Built as a responsive single-page web app with client-side state persistence in `localStorage`.
- **Ephemeral Filesystem**: On platforms like Render, the filesystem is ephemeral. The backend reads configuration from environment variables, not from `.env` files written at runtime.

