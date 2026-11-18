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

3. **Syllabus Intelligence**
   - Student-supplied curriculum instead of assumed curriculum: upload a text-based syllabus PDF (max 8 MB) or paste syllabus text.
   - Backend extraction (`pypdf`, in memory only) plus Groq structuring into units → topics → subtopics / learning outcomes.
   - Editable review screen (rename units, add/remove topics, edit subtopics and outcomes) before anything is saved as authoritative.
   - Explicit status per subject: *Not provided*, *Processing*, *Needs review*, or *Verified by student*, with extraction warnings surfaced for review.
   - Verified syllabi are stored per subject in `localStorage`. PDFs are never saved. Older subjects are migrated safely and simply remain without a syllabus.
   - The AI Tutor, Quiz Generator (unit/topic scope), and Smart Planner all use the verified syllabus; when none exists they say so and fall back to general subject knowledge.

4. **Pedagogical Priority Engine**
   - Mathematical ranking formula that removes guesswork from study planning:
     $$\text{Priority} = (0.35 \times \text{Urgency}) + (0.30 \times \text{Confidence Deficit}) + (0.20 \times \text{Difficulty}) + (0.15 \times \text{Credit Weight})$$
   - Categorizes subjects into actionable tiers: *Critical Focus* ($\ge 75$), *High Priority* ($60-74$), *Moderate*, and *Maintained*.
   - Interactive breakdown cards showing factor contributions and specific recommendations.
   - Recharts horizontal priority distribution comparison chart.

5. **Smart Daily Planner & Live Focus Timer**
   - Auto-allocates available study hours (1–8h) into realistic study sessions and structured rest breaks.
   - Higher-priority subjects automatically receive priority block sequencing.
   - Interactive timeline: Check off completed blocks with dynamic progress visualization.
   - Live Study Timer with Pomodoro (25m), Deep Focus (45m), and Break (15m) modes.
   - **Log Time to Course**: Completed timer sessions update course study hours and weekly velocity metrics in `localStorage`.

6. **Exam Intelligence (PYQ + Date Sheet + Allocation)**
   - **PYQ analysis**: upload multiple previous-year papers per subject (PDF, max 8 MB, in memory only), extract questions, marks, years, units/topics and subtopics, and classify them against the subject's verified syllabus. AI-classified or unmatched topics are explicitly flagged for student review, and every classification remains editable.
   - **Topic frequency**: actual question occurrences per topic (duplicates inside one paper count once), across how many papers, years seen, known-marks distribution, and the associated questions. Historical frequency is explicitly labelled as history, **not a prediction**.
   - **Exam date sheet**: upload a date-sheet PDF or add exams manually, then review/edit subject, code, date and time before saving. Missing subjects can be created from the review screen. Duplicate, unmatched, invalid and ambiguous entries are surfaced rather than silently accepted.
   - **Study availability**: daily hours, preferred windows (morning/afternoon/evening), weekly unavailable days, preferred session length and buffer time.
   - **Deterministic allocation**: a transparent weighted engine combines days until the exam, syllabus gap, topic count, difficulty, confidence, completion, revision needs, PYQ frequency and known marks. It shows each subject's weight and per-topic minutes; Groq never invents study durations. A minimum block is reserved for every eligible exam subject, so it is never a simple equal split and never drops an upcoming exam.
   - **Exam-aware Smart Planner**: generates blocks for every eligible exam subject, prioritises near exams, covers incomplete and revision topics, adds PYQ practice, respects availability/windows, avoids scheduling new preparation after an exam, explains every block, and regenerates while preserving completed and pinned sessions. Blocks can be completed, pinned, rescheduled or re-timed.
   - **Dashboard integration**: next examination and countdown, preparation progress, subject-wise completion, PYQ coverage, attention topics, and today's recommended sessions.

7. **AI Academic Tutor (Groq Powered)**
   - High-speed, low-latency reasoning powered by the official Groq Python SDK.
   - **Answer Style Selector**:
     - ⚡ **Quick Answer**: Concise, direct explanations in 1–3 focused paragraphs without introductory fluff.
     - 📄 **Exam Ready**: Structured college-level format with formal definitions, numbered mechanisms, concrete examples/code, and exam takeaways.
     - 🎓 **Detailed Explanation**: Comprehensive pedagogical masterclass with conceptual foundations, step-by-step algorithms, real-world industry applications, comparison tables, and revision summary checklists.
   - **Enhanced Markdown & Code Rendering**: Full support for responsive Markdown tables, syntax-highlighted code blocks with one-click copy, bulleted/numbered lists, and bold text.
   - Subject-grounded context dropdown to focus the tutor on specific course syllabi.
   - Fast exam revision, concept breakdowns, step-by-step problem explanations, and mnemonics.
   - "Generate Quiz from Topic" action directly converts conversation topics into diagnostic quizzes.

8. **AI Diagnostic Quiz Generator (Groq Powered)**
   - Generates exam-standard multiple-choice questions (3, 5, or 10 questions) tailored to selected courses and topics.
   - Configurable difficulty: *Beginner*, *Intermediate*, or *Advanced*.
   - Interactive quiz player with real-time progress tracking.
   - Detailed pedagogical review: displays user answers vs correct answers with thorough conceptual explanations.
   - Direct handoff to AI Tutor to review questions answered incorrectly.

9. **Persistence & Demo Readiness**
   - All subjects, daily schedules, preferences, study hours, and quiz records persist across browser reloads via `localStorage`.
   - Pre-loaded with realistic college demo data (*Distributed Systems*, *Database Management Systems*, *Compiler Design*, *Computer Networks*, *Linear Algebra*).
   - One-click **Demo Data** reset in the navigation bar.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Recharts.
- **Backend**: Python 3.10+ / 3.14+, FastAPI, Uvicorn, Pydantic, Python-Dotenv, pypdf, python-multipart.
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

Open two PowerShell terminals in the project root (the folder where this repository is cloned).

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
| `POST` | `/api/chat` | Academic AI chat with subject context grounding via Groq. Optionally accepts a student-verified `syllabus` object. |
| `POST` | `/api/generate-quiz` | Generates structured JSON multiple choice questions with explanations. Accepts optional `syllabus_context` + `syllabus_grounded`. |
| `POST` | `/api/parse-syllabus` | Accepts `multipart/form-data` with a syllabus `file` (PDF, max 8 MB) or `text`, extracts selectable text and returns a validated structured syllabus plus warnings. PDFs are processed in memory and never stored. |
| `POST` | `/api/analyze-pyq` | Accepts a previous-year paper `file` (PDF, max 8 MB), optional `syllabus` JSON and subject identifiers. Extracts and deduplicates questions, normalises marks/year, classifies against the syllabus, and returns warnings. Never stores the PDF. |
| `POST` | `/api/parse-date-sheet` | Accepts a date-sheet `file` (PDF, max 8 MB). Returns subject, code, ISO date and 24-hour time plus warnings; invalid dates stay `null` instead of being guessed. |

> **Syllabus notes**: image-only/scanned PDFs return a clear error rather than fabricated content; malformed AI JSON returns `502`; unit numbers, topics, and university details are never invented (missing values stay empty or `null`).

> **Exam Intelligence notes**: PYQ/date-sheet parsing uses the same in-memory PDF pipeline and returns `422` for scanned PDFs or empty results and `502` for malformed AI JSON. Date sheets are parsed with day-first ambiguity warnings and never fabricate a date, time, year or marks value. All classification and date records remain editable in the browser.

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
3. **Persistence**: All user data — including verified syllabus units/topics, PYQ analyses, exam dates, allocations and per-topic completion — is stored in the browser's `localStorage`; no server-side database is required. Uploaded PDFs are never persisted.

### localStorage Keys

| Key | Contents |
| :--- | :--- |
| `studentos_subjects` | Subjects, topics, verified syllabus, and PYQ papers/classifications. Older records are migrated without deletion. |
| `studentos_exam_schedule` | Verified exam entries (subject/code/date/time/source/verification). |
| `studentos_study_availability` | Daily hours, windows, unavailable days, session length and buffer. |
| `studentos_timetable` | Generated/completed/pinned study blocks, including `reason`, `pinned` and `generatedBy`. |
| `studentos_planner_hours`, `studentos_planner_goal`, `studentos_planner_focus_duration` | Existing Smart Planner preferences, preserved across upgrades. |

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

The included `render.yaml` also sets the expected `VITE_API_BASE_URL` and production
`ALLOWED_ORIGINS` values for the default Render service names. If you rename either
service or use a custom domain, update those two values in Render before redeploying.

---

## 🛡️ Security & Constraints

- **No Secrets in Frontend**: `GROQ_API_KEY` is kept exclusively on the FastAPI backend and never transmitted to client code.
- **Strict Validation**: All AI-generated quiz payloads are validated via Pydantic schemas before returning to the frontend.
- **CORS Protection**: Backend restricts cross-origin requests to configured frontend domains in production.
- **API Key Management**: The `/api/set-key` endpoint has been disabled. API keys must be configured via deployment platform environment variables.
- **Zero Authentication / Server Database Overhead**: Built as a responsive single-page web app with client-side state persistence in `localStorage`.
- **Ephemeral Filesystem**: On platforms like Render, the filesystem is ephemeral. The backend reads configuration from environment variables, not from `.env` files written at runtime.
