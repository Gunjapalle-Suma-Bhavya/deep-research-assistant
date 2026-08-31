"""Deep Research Multi-Agent Package.

A production-grade multi-agent research architecture built with LangGraph:
- Scoping & Clarification
- Research Agent with Custom Search Tools
- Model Context Protocol (MCP) Integration
- Supervisor with Parallel Subagent Delegation
- Structured Final Report Synthesis
"""

from deep_research.state import (
    ResearchState,
    ScopingState,
    SupervisorState,
    WorkerState,
    ResearchReport,
    ResearchQuestion,
    ClarifyWithUser,
)
from deep_research.tools import (
    tavily_search_tool,
    duckduckgo_search_tool,
    summarize_content,
    get_search_tool,
)
from deep_research.scoping import build_scoping_graph
from deep_research.research_agent import build_researcher_graph
from deep_research.supervisor import build_supervisor_graph
from deep_research.writer import generate_final_report
from deep_research.full_agent import build_deep_research_graph

__all__ = [
    "ResearchState",
    "ScopingState",
    "SupervisorState",
    "WorkerState",
    "ResearchReport",
    "ResearchQuestion",
    "ClarifyWithUser",
    "tavily_search_tool",
    "duckduckgo_search_tool",
    "summarize_content",
    "get_search_tool",
    "build_scoping_graph",
    "build_researcher_graph",
    "build_supervisor_graph",
    "generate_final_report",
    "build_deep_research_graph",
]
