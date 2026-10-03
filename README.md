# 🏛️ Deep Research Multi-Agent Assistant

[![Python 3.10+](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Cyclical%20Multi--Agent-FF6F00.svg)](https://www.langchain.com/langgraph)
[![LangSmith](https://img.shields.io/badge/LangSmith-Tracing%20%26%20Evaluation-1C3C3C.svg)](https://smith.langchain.com/)
[![React 18](https://img.shields.io/badge/React-18.3.1-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Classic%20Editorial-2A4736.svg)](https://tailwindcss.com/)

> An enterprise-grade, autonomous **Deep Research system** combining **LangGraph cyclical multi-agent graphs**, **FastAPI**, **MongoDB Atlas**, **LangSmith observability**, and a **Classic Editorial React interface**. Performs date-aware scoping, parallel multi-topic web investigation, cross-verification, and authors publication-grade academic monographs with inline citations, voice narration, and multi-format exports.

---

## 📐 System Architecture & Workflow

```
                               ┌────────────────────────────────────────────────────────┐
                               │               User Research Desk & Query               │
                               │  (Text Prompt or Web Speech Voice Dictation [Mic 🎙️])  │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │         Phase 1: Scoping & Clarification Agent         │
                               │     • Analyzes ambiguity, domain, and time horizon     │
                               │     • Structured Pydantic Output: ClarifyWithUser      │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                ┌──────────────────────────┴──────────────────────────┐
                                ▼                                                     ▼
                  [Clarification Required]                                   [Scope Is Well-Defined]
               Dynamic 3-Question Modal Dialog                                        │
                                │                                                     │
                                └──────────────────────────┬──────────────────────────┘
                                                           │
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │            Phase 2: Research Architect Brief           │
                               │  Synthesizes query into core thesis + 3-5 subtopics    │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │              Phase 3: Research Supervisor              │
                               │    • Decomposes subtopics into parallel search plans   │
                               │    • Selects Investigation Domain Mode                 │
                               │      (General Empirical / Academic .edu / Financial)   │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                        ┌──────────────────────────────────┼──────────────────────────────────┐
                        ▼                                  ▼                                  ▼
             ┌─────────────────────┐            ┌─────────────────────┐            ┌─────────────────────┐
             │ Sub-Researcher #1   │            │ Sub-Researcher #2   │            │ Sub-Researcher #3   │
             │ • Tavily Web Search │            │ • Tavily Web Search │            │ • Tavily Web Search │
             │ • DuckDuckGo Fallback│           │ • DuckDuckGo Fallback│           │ • DuckDuckGo Fallback│
             │ • Evidence Extractor│            │ • Evidence Extractor│            │ • Evidence Extractor│
             └──────────┬──────────┘            └──────────┬──────────┘            └──────────┬──────────┘
                        │                                  │                                  │
                        └──────────────────────────────────┼──────────────────────────────────┘
                                                           │ (asyncio.gather parallel execution)
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │              Phase 4: Synthesis & Writer               │
                               │   • Cross-examines contradictory empirical claims      │
                               │   • Authors publication monograph with [1], [2] links  │
                               │   • Generates Executive Summary & Primary Dossier      │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │       Completed Monograph & Interaction Suite          │
                               ├────────────────────────────────────────────────────────┤
                               │ • 💬 "Chat with Monograph" (Grounded Follow-up Q&A)    │
                               │ • 🔊 ElevenLabs AI Audio Briefing (with browser TTS)   │
                               │ • 📄 Multi-Format Export (Word .docx, BibTeX, MD, HTML)│
                               │ • 🔗 Public Sharing Link (/share/:shareToken)          │
                               │ • 🔒 Isolated User Archive (MongoDB Atlas Persistence) │
                               │ • 🔭 Live Tracing in LangSmith Dashboard               │
                               └────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Capabilities

### 1. 🤖 Cyclical Multi-Agent Graph (LangGraph)
- **Scoping Agent**: Prevents wasted compute by determining if an inquiry is underspecified, prompting the researcher with targeted clarifying questions.
- **Supervisor Agent**: Plans dynamic parallel workflows, orchestrating concurrent worker agents (`asyncio.gather`) across sub-topics.
- **Domain Investigation Modes**:
  - **General Empirical**: Unrestricted live web exploration.
  - **Academic Mode**: Concentrates searches on `.edu`, `.org`, `arxiv.org`, `nature.com`, and peer-reviewed preprint servers.
  - **Financial & Market Mode**: Targets SEC filings, earnings releases, regulatory disclosures, and market analytics.
- **Synthesizer / Writer**: Compiles structured editorial sections, callout boxes, and rigorous inline bracketed citations.

### 2. 💬 Interactive "Chat with Monograph"
- Discuss completed reports directly through an editorial sliding drawer without re-running 5-minute research graphs.
- Questions are strictly grounded in the monograph's full text and primary retrieved source dossier with bracketed reference tags (`[1]`, `[2]`).

### 3. 📄 Multi-Format Export Suite
- **Academic BibTeX (`.bib`)**: Ready for 1-click import into **Zotero**, **Mendeley**, and **LaTeX / Overleaf**.
- **Microsoft Word (`.docx`)**: Styled with editorial publication typography, formatted headings, callout boxes, and references.
- **Markdown (`.md`) & HTML (`.html`)**: Clean standalone documents.
- **Structured JSON (`.json`)**: Full programmatic dump of logs, sources, and agent intermediate steps.
- **Print / PDF**: Direct browser print rendering with editorial page margins.

### 4. 🎙️ Voice Input & ElevenLabs Audio Briefings
- **Speech-to-Text Input**: Dictate research hypotheses directly into the inquiry prompt via the Web Speech API with live audio feedback.
- **Audio Monograph Narration**: Streams premier ElevenLabs AI voice narration (`eleven_turbo_v2_5`) with automated fallback to native browser speech synthesis.

### 5. 🔒 Multi-User Archive Isolation & Security
- **Strict User Privacy**: One user's research history is **never visible** to another user.
- **Authentication**: JWT token verification, Google OAuth (Google Identity Services SDK), and salted password hashing.
- **Dual-Mode Storage**: MongoDB Atlas cloud cluster with seamless resilient fallback to local JSON storage.
- **User-Scoped Operations**: Purging archives or deleting tasks only impacts the authenticated caller's own records.

### 6. 🔭 LangSmith Observability & Evaluation
- Automatic live tracing of every agent node transition, LLM call, token usage, latency metric, and evaluation run under project `deep-research-assistant`.
- In-app **LangSmith Observability & Tracing** card in Settings with 1-click shortcut to [smith.langchain.com](https://smith.langchain.com).

---

## 📂 Project Structure

```
deep-research-assistant/
├── backend/                              # FastAPI Backend Application
│   ├── app/
│   │   ├── config.py                     # Environment, secrets & LangSmith setup
│   │   ├── main.py                       # FastAPI entry point & React SPA server
│   │   ├── schemas.py                    # Pydantic request/response models
│   │   ├── db/
│   │   │   └── mongodb.py                # MongoDB Atlas async client & hybrid fallback
│   │   ├── services/
│   │   │   ├── auth_service.py           # JWT & Google OAuth verification
│   │   │   ├── research_service.py       # LangGraph orchestrator & SSE broadcaster
│   │   │   ├── storage.py                # User-scoped task storage manager
│   │   │   ├── export_service.py         # Word (.docx), BibTeX, HTML & JSON generators
│   │   │   └── elevenlabs_service.py     # AI voice briefing synthesis
│   │   └── api/
│   │       ├── routes_auth.py            # /api/auth endpoints (Login, Signup, Google)
│   │       ├── routes_research.py        # /api/research endpoints (Lifecycle, SSE, Chat, Export)
│   │       └── routes_config.py          # /api/config & diagnostic health checks
├── frontend/                             # Modern React 18 Single-Page Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx                # Classic Editorial masthead & navigation
│   │   │   ├── LandingPage.tsx           # Lead editorial showcase & architecture tour
│   │   │   ├── ResearchInputView.tsx     # Voice dictation & query scoping form
│   │   │   ├── AgentDAGVisualizer.tsx    # Live multi-agent graph state machine
│   │   │   ├── LiveProgressFeed.tsx      # SSE streaming activity log & progress
│   │   │   ├── ReportViewer.tsx          # Monograph reader, export menu & audio player
│   │   │   ├── ReportChatDrawer.tsx      # Grounded follow-up chat drawer
│   │   │   ├── CitationInspector.tsx     # Deep citation side drawer
│   │   │   ├── ClarificationModal.tsx    # Human-in-the-loop clarification dialog
│   │   │   ├── HistoryDrawer.tsx         # User-isolated research archives
│   │   │   ├── AuthView.tsx              # Split-screen editorial sign-in & sign-up
│   │   │   └── SettingsModal.tsx         # API keys & LangSmith observability status
│   │   ├── services/
│   │   │   ├── api.ts                    # Type-safe REST client
│   │   │   └── sseClient.ts              # Resilient SSE client with query token auth
│   │   ├── types/                        # Core TypeScript interfaces
│   │   ├── App.tsx                       # Client routing (react-router-dom) & state
│   │   └── main.tsx                      # DOM entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── src/
│   └── deep_research/                    # Reusable LangGraph Research Package
│       ├── scoping.py                    # Scoping LLM & ClarifyWithUser
│       ├── supervisor.py                 # Multi-agent supervisor & task planner
│       ├── research_agent.py             # Parallel sub-researcher worker
│       ├── writer.py                     # Monograph synthesis & citation formatter
│       ├── full_agent.py                 # Unified cyclical StateGraph pipeline
│       ├── tools.py                      # Tavily API + DuckDuckGo fallback
│       └── state.py                      # Shared agent state definitions
├── notebooks/                            # Step-by-Step Educational Notebooks
├── run.py                                # Dual server launcher & environment health validator
├── requirements.txt                      # Python dependencies
└── .env.example                          # Environment template
```

---

## ⚡ Quick Start Guide

### 1. Clone the Repository

```bash
git clone https://github.com/Gunjapalle-Suma-Bhavya/deep-research-assistant.git
cd deep-research-assistant
```

### 2. Python Environment Setup

```bash
# Create virtual environment
python -m venv .venv

# Activate on Windows:
.\.venv\Scripts\activate

# Activate on Linux/macOS:
source .venv/bin/activate

# Install dependencies:
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Configure Environment (`.env`)

Copy the template:
```bash
cp .env.example .env
```

Edit `.env` with your API keys:
```env
# LLM Endpoint (OpenAI, AI Credits, DeepSeek, OpenRouter, Ollama)
OPENAI_API_KEY=your_openai_or_compatible_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini

# Search Provider (Tavily or automatic DuckDuckGo fallback)
TAVILY_API_KEY=your_tavily_key

# LangSmith Observability (Optional)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key
LANGCHAIN_PROJECT=deep-research-assistant

# ElevenLabs Text-to-Speech (Optional)
ELEVENLABS_API_KEY=your_elevenlabs_key

# MongoDB Database (Optional - defaults to resilient local storage)
MONGODB_URI=your_mongodb_atlas_connection_string
```

*(Note: All API keys can also be configured directly in the web UI Settings modal without touching `.env`).*

### 5. Launch the Application

```bash
python run.py
```

- **Interactive Application**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive API Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Vite Hot-Reload Dev Server (Optional)**: `cd frontend && npm run dev` on [http://localhost:3000](http://localhost:3000)

---

## 🚀 Deploying to Render

This application is fully production-ready for deployment on **[Render](https://render.com)** as a Web Service.

### Option 1: 1-Click / Blueprint Deployment (Recommended)

1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Blueprint**.
3. Connect your GitHub repository: `https://github.com/Gunjapalle-Suma-Bhavya/deep-research-assistant`.
4. Render will automatically detect [`render.yaml`](render.yaml) and pre-configure the service:
   - **Environment**: Docker (multi-stage build that compiles the React SPA and runs FastAPI)
   - **Plan**: Free
   - **Health Check**: `/health`
5. Supply your environment secrets when prompted (or configure them in Web UI Settings):
   - `OPENAI_API_KEY`: Your OpenAI or compatible API key
   - `TAVILY_API_KEY`: (Optional) For high-relevance web search
   - `ELEVENLABS_API_KEY`: (Optional) For voice search and audio playback
   - `MONGODB_URI`: (Optional) MongoDB Atlas connection string
   - `LANGSMITH_API_KEY`: (Optional) LangSmith tracing API key
6. Click **Apply**. Render will automatically build the container and deploy your live URL.

### Option 2: Manual Web Service Deployment

If you prefer setting up the Web Service manually on Render:

1. In Render Dashboard, click **New +** > **Web Service**.
2. Select your repository: `Gunjapalle-Suma-Bhavya/deep-research-assistant`.
3. Choose one of two runtime methods:
   - **Method A (Docker - Recommended)**:
     - **Runtime**: `Docker`
     - **Dockerfile Path**: `./Dockerfile`
     - Render handles both frontend compilation and backend packaging automatically.
   - **Method B (Native Python)**:
     - **Runtime**: `Python 3`
     - **Build Command**: `./build.sh` (or `pip install -r requirements.txt && cd frontend && npm install && npm run build && cd ..`)
     - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Add your Environment Variables under the **Environment** tab:
   - `HOST` = `0.0.0.0`
   - `OPENAI_API_KEY` = `your_openai_key`
   - `OPENAI_MODEL` = `gpt-4o-mini`
   - `JWT_SECRET` = *(Generate a random 32-character secret)*
5. Set **Health Check Path** to `/health`.
6. Click **Create Web Service**.

---

## 🧪 Testing

Run backend tests:
```bash
pytest tests/ -v
```

Run frontend test suite:
```bash
cd frontend
npm run test
```

---

## 👩‍💻 Author & Repository

- **Repository**: [Gunjapalle-Suma-Bhavya/deep-research-assistant](https://github.com/Gunjapalle-Suma-Bhavya/deep-research-assistant)
- **Author**: **Suma Bhavya** ([@Gunjapalle-Suma-Bhavya](https://github.com/Gunjapalle-Suma-Bhavya))
