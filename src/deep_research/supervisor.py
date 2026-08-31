"""Research Supervisor Subgraph.

Coordinates multi-agent research through parallel sub-topic delegation,
context isolation per sub-researcher, and asynchronous aggregation of findings.
"""

import asyncio
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, START, END

from deep_research.state import SupervisorState, ResearchNote, ResearchQuestion
from deep_research.research_agent import run_single_research_topic
from deep_research.scoping import get_llm


class ConductResearch(BaseModel):
    """Structured tool for delegating research on a specific sub-topic."""

    topic: str = Field(description="Sub-topic to be researched.")
    search_queries: List[str] = Field(
        description="2 to 3 targeted search queries for the worker agent."
    )
    depth: str = Field(
        default="in-depth", description="Research depth level: 'overview' or 'in-depth'."
    )


class SupervisorPlan(BaseModel):
    """Structured plan of research tasks to execute in parallel."""

    tasks: List[ConductResearch] = Field(
        description="List of distinct sub-topics to research concurrently."
    )
    coordination_strategy: str = Field(
        description="High-level strategy for covering the complete research scope."
    )


def get_supervisor_prompt() -> str:
    """System prompt for Research Supervisor."""
    return """You are the Lead Research Supervisor orchestrating a team of specialized research agents.
Your goal is to ensure comprehensive, rigorous coverage of all aspects of the research brief.

Review the research brief and generate distinct research assignments (ConductResearch tasks)
for each sub-topic so they can be investigated in parallel by worker agents.
Ensure the search queries are precise, technical, and targeted.
"""


async def supervisor_plan_node(state: SupervisorState) -> Dict[str, Any]:
    """Node: Supervisor analyzes brief and creates parallel research tasks."""
    brief: ResearchQuestion = state.research_brief
    llm = get_llm(temperature=0.2)
    structured_llm = llm.with_structured_output(SupervisorPlan)
    
    prompt = f"""Research Brief:
Title: {brief.title}
Core Question: {brief.core_question}
Sub-Topics: {', '.join(brief.sub_topics)}
Target Depth: {brief.target_depth}
Key Requirements: {', '.join(brief.key_requirements)}

Create the parallel research plan delegating tasks for each sub-topic.
"""
    
    messages = [
        SystemMessage(content=get_supervisor_prompt()),
        HumanMessage(content=prompt),
    ]
    
    try:
        plan: SupervisorPlan = await structured_llm.ainvoke(messages)
        tasks_dict = [t.model_dump() for t in plan.tasks]
        return {
            "delegated_tasks": tasks_dict,
            "iteration_count": state.iteration_count + 1,
        }
    except Exception as e:
        print(f"[Supervisor] Planning error: {e}")
        # Fallback plan from sub_topics
        fallback_tasks = []
        for st in brief.sub_topics:
            fallback_tasks.append({
                "topic": st,
                "search_queries": [f"{brief.title} {st}", st],
                "depth": brief.target_depth,
            })
        return {
            "delegated_tasks": fallback_tasks,
            "iteration_count": state.iteration_count + 1,
        }


async def parallel_research_node(state: SupervisorState) -> Dict[str, Any]:
    """Node: Execute delegated research tasks in parallel using asyncio.gather()."""
    tasks = state.delegated_tasks or []
    if not tasks:
        return {"completed_notes": [], "is_complete": True}
    
    # Run subagents concurrently with context isolation
    async def _run_task(task_data: Dict[str, Any]) -> ResearchNote:
        return await run_single_research_topic(
            topic=task_data.get("topic", "General Topic"),
            queries=task_data.get("search_queries", []),
            depth=task_data.get("depth", "in-depth"),
        )
    
    results: List[ResearchNote] = await asyncio.gather(
        *[_run_task(t) for t in tasks],
        return_exceptions=False,
    )
    
    return {
        "completed_notes": list(results),
        "is_complete": True,
    }


def build_supervisor_graph():
    """Build and compile the Supervisor LangGraph."""
    workflow = StateGraph(SupervisorState)
    
    workflow.add_node("supervisor_plan", supervisor_plan_node)
    workflow.add_node("parallel_research", parallel_research_node)
    
    workflow.add_edge(START, "supervisor_plan")
    workflow.add_edge("supervisor_plan", "parallel_research")
    workflow.add_edge("parallel_research", END)
    
    return workflow.compile()
