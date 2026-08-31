# 🔍 Deep Research Multi-Agent Assistant

[![Python 3.10+](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-FF6F00.svg)](https://www.langchain.com/langgraph)

> An enterprise-grade, autonomous Deep Research system built with **LangGraph**, **FastAPI**, and a **modern responsive web interface**. Performs intelligent scoping, multi-topic parallel investigation across web sources, and synthesizes publication-quality research reports with verified citations.

---

## 🌟 Key Features

- **🎯 Intelligent Scoping & Human-in-the-Loop Clarification**: Analyzes user research requests and determines if clarification is needed using structured Pydantic outputs (`ClarifyWithUser`).
- **⚡ Parallel Multi-Agent Coordination**: A central **Research Supervisor** breaks complex briefs into distinct sub-topics and orchestrates parallel worker agents concurrently (`asyncio.gather`).
- **🌐 Resilient Web Search & Tooling**: Supports **Tavily Search API** and includes an automatic zero-config **DuckDuckGo fallback**, so research works reliably in any environment.
- **🔌 Model Context Protocol (MCP)**: Includes standardized adapters to connect with local and remote MCP tool servers.
- **📝 Publication-Grade Report Synthesis**: Produces comprehensive Markdown reports complete with Executive Summaries, In-Depth Body Sections, Key Takeaways, and formal Citations.
- **🌊 Real-Time SSE Streaming**: Live event broadcasting showing active graph nodes, search queries, tool outputs, and supervisor thoughts in real time.
- **💻 Modern Single-Page Application**: Sleek UI with Dark/Light theme, interactive multi-agent workflow visualizer, research history, copy-to-clipboard, raw JSON inspector, and multi-format exports (Markdown, HTML, PDF).
- **🔑 Dynamic In-App Settings & API Key Manager**: Switch between OpenAI, DeepSeek, OpenRouter, Groq, and Local Ollama directly in the browser with live connection testing.
- **🎭 Zero-Cost Demo / Portfolio Presentation Mode**: Run realistic end-to-end multi-agent simulations with zero API key cost for interviews and reviews.

---

## 📐 System Architecture

```
                               ┌─────────────────────────┐
                               │   User Research Query   │
                               └────────────┬────────────┘
                                            │
                                            ▼
                          ┌──────────────────────────────────┐
                          │   Phase 1: Scoping Agent         │
                          │  (ClarifyWithUser & Brief Gen)   │
                          └─────────────────┬────────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
           [Clarification Needed]                           [Scope Is Clear]
           Interactive User Prompt                                 │
                     │                                             │
                     └──────────────────────┬──────────────────────┘
                                            │
                                            ▼
                          ┌──────────────────────────────────┐
                          │   Phase 2: Research Supervisor   │
                          │   (Sub-topic Task Decomposition) │
                          └─────────────────┬────────────────┘
                                            │
             ┌──────────────────────────────┼──────────────────────────────┐
             ▼                              ▼                              ▼
  ┌──────────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
  │ Sub-Researcher #1    │       │ Sub-Researcher #2    │       │ Sub-Researcher #3    │
  │ • Web Search         │       │ • Web Search         │       │ • Web Search         │
  │ • Content Summarizer │       │ • Content Summarizer │       │ • Content Summarizer │
  └──────────┬───────────┘       └──────────┬───────────┘       └──────────┬───────────┘
             │                              │                              │
             └──────────────────────────────┼──────────────────────────────┘
                                            │ (asyncio.gather)
                                            ▼
                          ┌──────────────────────────────────┐
                          │   Phase 3: Report Writer         │
                          │  (Synthesis & Formal Citations)  │
                          └─────────────────┬────────────────┘
                                            │
                                            ▼
                          ┌──────────────────────────────────┐
                          │     Final Research Report        │
                          │  (Markdown / HTML / PDF Export)  │
                          └──────────────────────────────────┘
```

---

## 📂 Project Structure

```
deep-research-assistant/
├── backend/                          # FastAPI Backend Application
│   ├── app/
│   │   ├── config.py                 # Environment configuration & settings
│   │   ├── main.py                   # FastAPI entry point & static file mount
│   │   ├── schemas.py                # Pydantic API schemas & data models
│   │   ├── services/
│   │   │   ├── research_service.py   # Async task manager & SSE broadcaster
│   │   │   ├── storage.py            # Research history & report persistence
│   │   │   └── export_service.py     # Markdown, HTML, and PDF exporters
│   │   └── api/
│   │       ├── routes_research.py    # /api/research endpoints
│   │       └── routes_config.py      # /api/config & /api/health endpoints
├── frontend/                         # Modern Responsive SPA Frontend
│   ├── index.html                    # Single Page App interface
│   ├── css/
│   │   └── styles.css                # Premium styling (Dark/Light mode, animations)
│   └── js/
│       ├── api.js                    # Backend REST client
│       ├── stream.js                 # Server-Sent Events handler
│       ├── graph_view.js             # Visual multi-agent workflow visualizer
│       └── app.js                    # Main UI controller & state management
├── notebooks/                        # Clean Tutorial Jupyter Notebooks
│   ├── 1_scoping.ipynb               # 1. Scoping & User Clarification
│   ├── 2_research_agent.ipynb        # 2. Research Agent with Custom Search Tools
│   ├── 3_research_agent_mcp.ipynb    # 3. Research Agent with MCP Protocol
│   ├── 4_research_supervisor.ipynb   # 4. Multi-Agent Supervisor & Parallelism
│   └── 5_full_agent.ipynb            # 5. Full Multi-Agent End-to-End System
├── src/
│   └── deep_research/                # Core reusable Python package
│       ├── scoping.py                # Clarification & brief generation
│       ├── supervisor.py             # Multi-agent supervisor & delegation
│       ├── research_agent.py         # Subagent research worker
│       ├── writer.py                 # Report synthesis & markdown generation
│       ├── full_agent.py             # Unified end-to-end LangGraph pipeline
│       ├── mcp_adapter.py            # Model Context Protocol adapter
│       ├── tools.py                  # Tavily + DuckDuckGo web search
│       └── state.py                  # Pydantic state graph schemas
├── tests/                            # Comprehensive Test Suite
│   ├── conftest.py
│   ├── test_tools.py
│   └── test_api.py
├── .env.example                      # Configuration template
├── .gitignore                        # Git exclusion rules
├── pyproject.toml                    # Package metadata & dependencies
├── requirements.txt                  # Dependency list
├── run.py                            # One-click startup script
└── README.md                         # Project documentation
```

---

## 🚀 Quick Start Guide

### 1. Clone & Navigate

```bash
git clone https://github.com/your-username/deep-research-assistant.git
cd deep-research-assistant
```

### 2. Environment Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure `.env` (Optional)

```bash
cp .env.example .env
```

*(You can also configure API keys directly inside the web UI Settings modal without editing `.env` files).*

### 4. Launch Application

```bash
python run.py
```

- **Web Dashboard**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🧪 Running Tests

Execute the automated test suite:

```bash
pytest tests/ -v
```

Or using standard Python unittest:
```bash
python3 -m unittest discover -s tests
```
