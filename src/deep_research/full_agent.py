"""Full Multi-Agent Deep Research System.

Combines Scoping, Multi-Agent Supervisor with Parallel Subagents,
and Final Report Synthesis into an integrated LangGraph pipeline.
"""

from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, START, END

from deep_research.state import ResearchState, ScopingState, SupervisorState
from deep_research.scoping import check_clarification, generate_research_brief
from deep_research.supervisor import supervisor_plan_node, parallel_research_node
from deep_research.writer import generate_final_report


async def scope_node(state: ResearchState) -> Dict[str, Any]:
    """Node 1: Analyze user request and assess clarification needs."""
    scoping_state = ScopingState(
        user_query=state.user_query,
        user_response=state.clarification_responses.get("response"),
    )
    
    # Check if user already provided clarification
    if not state.clarification_responses:
        clarif_result = await check_clarification(scoping_state)
        clarif = clarif_result.get("clarification")
        if clarif and clarif.needs_clarification:
            return {
                "clarification": clarif,
                "needs_user_input": True,
                "status": "waiting_for_clarification",
                "current_node": "scope",
                "progress_percentage": 20,
            }
    
    # Generate structured brief
    scoping_state.user_response = state.clarification_responses.get("response", "")
    brief_result = await generate_research_brief(scoping_state)
    brief = brief_result.get("research_brief")
    
    return {
        "research_brief": brief,
        "needs_user_input": False,
        "status": "scoping_completed",
        "current_node": "supervisor",
        "progress_percentage": 35,
    }


def route_after_scoping(state: ResearchState) -> str:
    """Route: Pause if clarification needed, otherwise proceed to supervisor."""
    if state.needs_user_input:
        return "wait_for_clarification"
    return "supervisor"


async def supervisor_node(state: ResearchState) -> Dict[str, Any]:
    """Node 2: Supervisor plans sub-topic breakdown and executes parallel research."""
    if not state.research_brief:
        raise ValueError("Research brief missing prior to supervisor node.")
    
    supervisor_state = SupervisorState(
        research_brief=state.research_brief,
    )
    
    # Plan parallel tasks
    plan_result = await supervisor_plan_node(supervisor_state)
    supervisor_state.delegated_tasks = plan_result.get("delegated_tasks", [])
    
    # Execute parallel research
    research_result = await parallel_research_node(supervisor_state)
    completed_notes = research_result.get("completed_notes", [])
    
    # Extract unique sources
    all_sources = []
    seen = set()
    for n in completed_notes:
        for s in n.sources:
            u = s.get("url", "")
            if u and u not in seen:
                seen.add(u)
                all_sources.append(s)
    
    return {
        "research_notes": completed_notes,
        "sources": all_sources,
        "status": "research_completed",
        "current_node": "writer",
        "progress_percentage": 75,
    }


async def writer_node(state: ResearchState) -> Dict[str, Any]:
    """Node 3: Synthesize all notes into the final structured report."""
    if not state.research_brief:
        raise ValueError("Research brief missing in writer node.")
    
    report = await generate_final_report(
        brief=state.research_brief,
        notes=state.research_notes,
        all_sources=state.sources,
    )
    
    return {
        "final_report": report,
        "status": "completed",
        "current_node": "completed",
        "progress_percentage": 100,
    }


def build_deep_research_graph():
    """Build and compile the unified end-to-end Deep Research Multi-Agent graph."""
    workflow = StateGraph(ResearchState)
    
    workflow.add_node("scope", scope_node)
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("writer", writer_node)
    
    workflow.add_edge(START, "scope")
    
    workflow.add_conditional_edges(
        "scope",
        route_after_scoping,
        {
            "wait_for_clarification": END,
            "supervisor": "supervisor",
        },
    )
    
    workflow.add_edge("supervisor", "writer")
    workflow.add_edge("writer", END)
    
    return workflow.compile()
