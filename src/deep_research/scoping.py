"""Scoping and Clarification Subgraph.

Clarifies research scope and transforms user input into structured research briefs
using structured output Pydantic schemas and date-aware prompts.
"""

from datetime import datetime
from typing import Dict, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END

from deep_research.state import ScopingState, ClarifyWithUser, ResearchQuestion


def get_llm(temperature: float = 0.2, model: Optional[str] = None) -> ChatOpenAI:
    """Initialize OpenAI-compatible LLM using environment configuration."""
    import os
    
    api_key = os.getenv("OPENAI_API_KEY", "dummy-key")
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    model_name = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    return ChatOpenAI(
        model=model_name,
        openai_api_key=api_key,
        openai_api_base=base_url,
        temperature=temperature,
    )


def get_scoping_system_prompt() -> str:
    """Return date-aware system prompt for research scoping."""
    today = datetime.now().strftime("%B %d, %Y")
    return f"""You are an expert Research Director and Scoping Specialist.
Today's Date: {today}

Your responsibility is to analyze the user's research request and decide whether clarification is needed.
- If the request is ambiguous, broad, or open to multiple interpretations, generate 1 to 3 targeted clarification questions.
- If the request is specific, clear, and actionable, mark needs_clarification=False and explain why the scope is well-defined.
"""


def get_brief_system_prompt() -> str:
    """Return date-aware system prompt for research brief generation."""
    today = datetime.now().strftime("%B %d, %Y")
    return f"""You are an expert Research Architect.
Today's Date: {today}

Your responsibility is to synthesize the user's request (and any clarification answers) into a structured research brief.
Define:
1. A clear title.
2. The core research question.
3. 3 to 5 distinct, exhaustive sub-topics for parallel investigation.
4. Target depth ('overview', 'in-depth', or 'comprehensive').
5. High-signal initial search queries to bootstrap the research.
6. Key requirements, constraints, or comparison criteria.
"""


async def check_clarification(state: ScopingState) -> Dict[str, Any]:
    """Node: Analyze user prompt and decide if clarification is required."""
    llm = get_llm(temperature=0.1)
    structured_llm = llm.with_structured_output(ClarifyWithUser)
    
    messages = [
        SystemMessage(content=get_scoping_system_prompt()),
        HumanMessage(content=f"User Research Request:\n{state.user_query}"),
    ]
    
    try:
        decision: ClarifyWithUser = await structured_llm.ainvoke(messages)
        return {
            "clarification": decision,
            "status": "clarification_needed" if decision.needs_clarification else "ready_for_brief",
        }
    except Exception as e:
        # Fallback if structured output fails
        print(f"[Scoping] Clarification check error: {e}")
        return {
            "clarification": ClarifyWithUser(
                needs_clarification=False,
                clarification_questions=[],
                reasoning="Proceeding with direct research scoping.",
            ),
            "status": "ready_for_brief",
        }


async def generate_research_brief(state: ScopingState) -> Dict[str, Any]:
    """Node: Generate structured research brief from prompt + user response."""
    llm = get_llm(temperature=0.2)
    structured_llm = llm.with_structured_output(ResearchQuestion)
    
    context = f"Original Request: {state.user_query}\n"
    if state.user_response:
        context += f"User Clarification Details: {state.user_response}\n"
    
    messages = [
        SystemMessage(content=get_brief_system_prompt()),
        HumanMessage(content=context),
    ]
    
    try:
        brief: ResearchQuestion = await structured_llm.ainvoke(messages)
        return {"research_brief": brief, "status": "completed"}
    except Exception as e:
        print(f"[Scoping] Brief generation error: {e}")
        # Fallback brief
        return {
            "research_brief": ResearchQuestion(
                title=f"Research on {state.user_query[:50]}",
                core_question=state.user_query,
                sub_topics=[
                    "Overview & Core Concepts",
                    "Key Mechanisms & Architecture",
                    "Current Trends & Benchmarks",
                    "Future Outlook & Practical Implications",
                ],
                target_depth="comprehensive",
                search_queries=[state.user_query, f"{state.user_query} analysis 2026"],
                key_requirements=["Comprehensive factual coverage", "Source citations"],
            ),
            "status": "completed",
        }


def route_scoping(state: ScopingState) -> str:
    """Conditional routing based on clarification need."""
    if state.clarification and state.clarification.needs_clarification and not state.user_response:
        return "wait_for_user"
    return "generate_brief"


def build_scoping_graph():
    """Construct and compile the LangGraph scoping workflow."""
    workflow = StateGraph(ScopingState)
    
    workflow.add_node("check_clarification", check_clarification)
    workflow.add_node("generate_brief", generate_research_brief)
    
    workflow.add_edge(START, "check_clarification")
    
    workflow.add_conditional_edges(
        "check_clarification",
        route_scoping,
        {
            "wait_for_user": END,
            "generate_brief": "generate_brief",
        },
    )
    
    workflow.add_edge("generate_brief", END)
    return workflow.compile()
