"""Generate a comprehensive Project Guide PDF for Deep Research Multi-Agent Assistant."""

import os
from pathlib import Path

def generate_guide_markdown():
    guide_path = Path(__file__).resolve().parent / "PROJECT_GUIDE.md"
    content = """# Deep Research Multi-Agent Assistant - Project & Architecture Guide

## 1. Executive Summary
The Deep Research Assistant is an autonomous, multi-agent AI research pipeline developed with LangGraph, FastAPI, and modern web technologies. It is specifically designed to perform end-to-end research on complex, open-ended queries by intelligently scoping the topic, delegating parallel sub-tasks across concurrent agents, and synthesizing cohesive, verified research reports.

## 2. Three-Phase Architecture
1. **Scope & Clarification**:
   - Uses structured outputs (`ClarifyWithUser`, `ResearchQuestion`) to eliminate ambiguity.
   - Grounded in real-time date context to ensure fresh search queries.
2. **Multi-Agent Parallel Research**:
   - Led by a central Supervisor Agent.
   - Decomposes briefs into isolated sub-topic tracks.
   - Executes ReAct search loops with Tavily API & DuckDuckGo search.
3. **Synthesis & Report Writing**:
   - Synthesizes findings into comprehensive Markdown reports.
   - Preserves formal citation links and executive takeaways.

## 3. Technology Stack
- **LangGraph & LangChain**: Graph orchestration, state machines, and structured outputs.
- **FastAPI**: Asynchronous REST endpoints with Server-Sent Events (SSE).
- **Frontend SPA**: Modern Tailwind CSS, Lucide icons, and live workflow graph visualization.
- **OpenAI-Compatible Engine**: Full support for OpenAI, AI credits, DeepSeek, OpenRouter, and local models.
"""
    with open(guide_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated Project Guide at: {guide_path}")

if __name__ == "__main__":
    generate_guide_markdown()
