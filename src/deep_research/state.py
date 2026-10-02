"""State definitions and Pydantic schemas for the Deep Research Multi-Agent system."""

from typing import Annotated, Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field
import operator


class ClarifyWithUser(BaseModel):
    """Structured output schema to determine if user clarification is required."""

    needs_clarification: bool = Field(
        description="Set to true if the research topic is ambiguous, underspecified, or requires critical scope decisions."
    )
    clarification_questions: List[str] = Field(
        default_factory=list,
        description="1 to 3 concise, highly targeted clarifying questions to ask the user if needs_clarification is True.",
    )
    reasoning: str = Field(
        description="Brief reasoning behind why clarification is or is not needed."
    )


class ResearchQuestion(BaseModel):
    """Structured research brief generated from initial prompt and user clarification."""

    title: str = Field(description="Descriptive title of the research project.")
    core_question: str = Field(
        description="The primary core research question to be answered."
    )
    sub_topics: List[str] = Field(
        description="List of 3 to 6 distinct sub-topics/dimensions to investigate."
    )
    target_depth: str = Field(
        default="comprehensive",
        description="Research depth level: 'overview', 'in-depth', or 'comprehensive'.",
    )
    search_queries: List[str] = Field(
        description="Initial targeted search queries to bootstrap research."
    )
    key_requirements: List[str] = Field(
        default_factory=list,
        description="Specific constraints, metrics, comparisons, or formatting guidelines requested.",
    )


class SearchResult(BaseModel):
    """Represents an individual search result item."""

    title: str = Field(description="Title of the web page or resource.")
    url: str = Field(description="Direct URL of the source.")
    snippet: str = Field(description="Relevant text excerpt or snippet.")
    content: Optional[str] = Field(
        default=None, description="Full or summarized content extracted from the page."
    )


class ResearchNote(BaseModel):
    """Structured note created by a worker researcher for a given sub-topic."""

    topic: str = Field(description="Sub-topic that was researched.")
    summary: str = Field(description="Synthesized summary of key findings.")
    key_findings: List[str] = Field(
        default_factory=list, description="Bullet points of key empirical facts or insights."
    )
    sources: List[Dict[str, str]] = Field(
        default_factory=list,
        description="List of sources used, each containing 'title' and 'url'.",
    )


class ReportSection(BaseModel):
    """A section within the final synthesized research report."""

    heading: str = Field(description="Section heading/title.")
    content: str = Field(description="Markdown content for this section.")


class ResearchReport(BaseModel):
    """Final synthesized research report."""

    title: str = Field(description="Title of the research report.")
    executive_summary: str = Field(description="Executive summary of all findings.")
    table_of_contents: List[str] = Field(
        default_factory=list, description="Table of contents outline."
    )
    sections: List[ReportSection] = Field(
        default_factory=list, description="Main detailed body sections."
    )
    key_takeaways: List[str] = Field(
        default_factory=list, description="Key actionable takeaways or conclusions."
    )
    sources: List[Dict[str, str]] = Field(
        default_factory=list, description="Aggregated list of all cited sources (title + url)."
    )
    full_markdown: str = Field(
        default="", description="Complete rendered markdown document."
    )


# ==============================================================================
# LangGraph TypedDict States
# ==============================================================================

class ScopingState(BaseModel):
    """State for the Scoping & Clarification Subgraph."""

    user_query: str
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)
    clarification: Optional[ClarifyWithUser] = None
    user_response: Optional[str] = None
    research_brief: Optional[ResearchQuestion] = None
    status: str = "initialized"


class WorkerState(BaseModel):
    """State for an individual sub-researcher agent."""

    topic: str
    search_queries: List[str] = Field(default_factory=list)
    depth: str = "in-depth"
    research_mode: str = "general"
    notes: List[ResearchNote] = Field(default_factory=list)
    raw_results: List[Dict[str, Any]] = Field(default_factory=list)
    iteration_count: int = 0
    max_iterations: int = 4
    status: str = "pending"


class SupervisorState(BaseModel):
    """State for the Supervisor Multi-Agent Subgraph."""

    research_brief: ResearchQuestion
    delegated_tasks: List[Dict[str, Any]] = Field(default_factory=list)
    completed_notes: List[ResearchNote] = Field(default_factory=list)
    supervisor_feedback: Optional[str] = None
    is_complete: bool = False
    iteration_count: int = 0
    max_iterations: int = 3


class ResearchState(BaseModel):
    """Master State for the End-to-End Deep Research LangGraph."""

    task_id: str
    user_query: str
    clarification_responses: Dict[str, str] = Field(default_factory=dict)
    
    # Scoping Phase
    clarification: Optional[ClarifyWithUser] = None
    research_brief: Optional[ResearchQuestion] = None
    needs_user_input: bool = False
    
    # Research Phase
    research_notes: List[ResearchNote] = Field(default_factory=list)
    sources: List[Dict[str, str]] = Field(default_factory=list)
    
    # Writer Phase
    final_report: Optional[ResearchReport] = None
    
    # Execution Tracking
    current_node: str = "start"
    status: str = "running"  # "running", "waiting_for_clarification", "completed", "failed"
    progress_percentage: int = 0
    activity_logs: List[Dict[str, Any]] = Field(default_factory=list)
    error: Optional[str] = None
