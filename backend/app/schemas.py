"""API Schemas and Data Models for FastAPI Backend."""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime


class ResearchStartRequest(BaseModel):
    """Payload to initiate a new deep research session."""

    query: str = Field(..., description="Research topic, prompt, or question.")
    depth: str = Field(
        default="comprehensive",
        description="Research depth level: 'overview', 'in-depth', or 'comprehensive'.",
    )
    custom_instructions: Optional[str] = Field(
        default=None, description="Optional user preferences, specific guidelines, or constraints."
    )


class ClarificationSubmitRequest(BaseModel):
    """Payload to submit user answers to clarification questions."""

    task_id: str = Field(..., description="Active research task ID.")
    responses: Dict[str, str] = Field(
        default_factory=dict, description="Key-value mapping of question index to user answer."
    )
    additional_notes: Optional[str] = Field(
        default=None, description="Any additional free-form context from the user."
    )


class ResearchTaskSummary(BaseModel):
    """Summary representation of a research task for list views."""

    task_id: str
    query: str
    title: Optional[str] = None
    status: str
    progress_percentage: int
    created_at: str
    updated_at: str


class ResearchTaskDetail(BaseModel):
    """Full detail of a research task including all agent findings and reports."""

    task_id: str
    query: str
    status: str
    progress_percentage: int
    created_at: str
    updated_at: str
    clarification_needed: bool = False
    clarification_questions: List[str] = Field(default_factory=list)
    clarification_reasoning: Optional[str] = None
    research_brief: Optional[Dict[str, Any]] = None
    research_notes: List[Dict[str, Any]] = Field(default_factory=list)
    sources: List[Dict[str, str]] = Field(default_factory=list)
    final_report: Optional[Dict[str, Any]] = None
    activity_logs: List[Dict[str, Any]] = Field(default_factory=list)
    error: Optional[str] = None


class ConfigUpdateRequest(BaseModel):
    """Payload to update runtime LLM and search configuration."""

    openai_api_key: Optional[str] = Field(default=None, description="OpenAI or compatible API Key.")
    openai_base_url: Optional[str] = Field(default=None, description="API Base URL endpoint.")
    openai_model: Optional[str] = Field(default=None, description="Model identifier string.")
    tavily_api_key: Optional[str] = Field(default=None, description="Tavily Search API Key.")
    search_provider: Optional[str] = Field(default=None, description="Search engine provider.")
    demo_mode: Optional[bool] = Field(default=None, description="Enable simulated zero-cost demo mode.")


class ConfigResponse(BaseModel):
    """Runtime configuration status and masked keys."""

    openai_configured: bool
    openai_masked_key: str
    openai_base_url: str
    openai_model: str
    tavily_configured: bool
    tavily_masked_key: str
    search_provider: str
    demo_mode: bool


class ConnectionTestRequest(BaseModel):
    """Payload to test LLM or Search connectivity."""

    openai_api_key: Optional[str] = None
    openai_base_url: Optional[str] = None
    openai_model: Optional[str] = None
    tavily_api_key: Optional[str] = None
    search_provider: Optional[str] = None


class ConnectionTestResponse(BaseModel):
    """Result of connectivity diagnostic."""

    llm_connected: bool
    llm_message: str
    llm_latency_ms: Optional[int] = None
    search_connected: bool
    search_message: str
    search_latency_ms: Optional[int] = None


# --- User Authentication Schemas ---

class UserSignUpRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=150)
    password: str = Field(..., min_length=6, max_length=100)


class UserLoginRequest(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    picture: Optional[str] = None
    auth_provider: str = "local"
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


