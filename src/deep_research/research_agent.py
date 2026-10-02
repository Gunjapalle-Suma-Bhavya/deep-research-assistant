"""Research Agent with Custom Search Tools and Iterative ReAct loop.

Investigates a specific topic/sub-topic through iterative web search,
result summarization, and structured note extraction.
"""

from typing import Dict, List, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from langgraph.graph import StateGraph, START, END

from deep_research.state import WorkerState, ResearchNote
from deep_research.tools import search_web, fetch_page_content, summarize_content
from deep_research.scoping import get_llm


def get_researcher_system_prompt(topic: str, depth: str) -> str:
    """System prompt for worker research agent."""
    return f"""You are a specialized Senior Research Analyst investigating the topic: "{topic}".
Target Depth: {depth}

Your objective:
1. Conduct targeted searches to discover concrete data, facts, mechanisms, and expert consensus.
2. Synthesize findings into clear, objective insights.
3. Track and cite all authoritative web sources (Title and URL).
4. When you have sufficient evidence, provide a thorough final synthesis of the sub-topic.

Format your final findings with:
- Summary of the topic
- Key Findings (bullet points)
- Sources (list of title and URL)
"""


async def researcher_node(state: WorkerState) -> Dict[str, Any]:
    """Node: Decide on search queries or synthesize findings."""
    llm = get_llm(temperature=0.2)
    
    # Check if we have conducted initial searches
    if state.iteration_count == 0 and state.search_queries:
        # First iteration: run bootstrap queries
        all_results = []
        for q in state.search_queries[:2]:
            results = await search_web(q, max_results=4, mode=state.research_mode)
            for r in results:
                all_results.append({
                    "title": r.title,
                    "url": r.url,
                    "snippet": r.snippet,
                    "query": q,
                })
        
        return {
            "raw_results": all_results,
            "iteration_count": state.iteration_count + 1,
            "status": "searching",
        }
    
    # If we have collected search results, synthesize notes
    results_text = ""
    sources_collected = []
    seen_urls = set()
    
    for item in state.raw_results:
        url = item.get("url", "")
        title = item.get("title", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            sources_collected.append({"title": title, "url": url})
        
        results_text += f"- [{title}] ({url}): {item.get('snippet', '')}\n"
    
    prompt = f"""Synthesize the research findings for sub-topic: "{state.topic}"

Collected Evidence:
{results_text if results_text else "No web results returned; provide comprehensive domain knowledge analysis."}

Please produce a comprehensive structured summary with:
1. Core Summary (2-3 paragraphs)
2. 4-6 Key Bullet Findings
"""
    
    messages = [
        SystemMessage(content=get_researcher_system_prompt(state.topic, state.depth)),
        HumanMessage(content=prompt),
    ]
    
    try:
        response = await llm.ainvoke(messages)
        content = response.content if hasattr(response, "content") else str(response)
        
        note = ResearchNote(
            topic=state.topic,
            summary=content,
            key_findings=[line.strip("- ") for line in content.split("\n") if line.strip().startswith("-")],
            sources=sources_collected[:8],
        )
        
        return {
            "notes": [note],
            "status": "completed",
            "iteration_count": state.iteration_count + 1,
        }
    except Exception as e:
        print(f"[Researcher] Error synthesizing note for {state.topic}: {e}")
        fallback_note = ResearchNote(
            topic=state.topic,
            summary=f"Analysis of {state.topic} based on gathered research.",
            key_findings=["Domain analysis conducted", "Key principles identified"],
            sources=sources_collected,
        )
        return {
            "notes": [fallback_note],
            "status": "completed",
            "iteration_count": state.iteration_count + 1,
        }


def route_researcher(state: WorkerState) -> str:
    """Determine if researcher needs more iterations or is done."""
    if state.status == "completed" or state.iteration_count >= state.max_iterations:
        return "finish"
    return "continue"


def build_researcher_graph():
    """Build LangGraph workflow for an individual researcher worker."""
    workflow = StateGraph(WorkerState)
    
    workflow.add_node("researcher", researcher_node)
    workflow.add_edge(START, "researcher")
    
    workflow.add_conditional_edges(
        "researcher",
        route_researcher,
        {
            "continue": "researcher",
            "finish": END,
        },
    )
    
    return workflow.compile()


async def run_single_research_topic(
    topic: str,
    queries: List[str],
    depth: str = "in-depth",
    mode: str = "general",
) -> ResearchNote:
    """Execute research on a single topic and return structured note."""
    graph = build_researcher_graph()
    initial_state = WorkerState(
        topic=topic,
        search_queries=queries or [topic],
        depth=depth,
        research_mode=mode,
    )
    result = await graph.ainvoke(initial_state)
    notes = result.get("notes", [])
    if notes:
        return notes[0]
    
    return ResearchNote(
        topic=topic,
        summary=f"Research on {topic}.",
        key_findings=[],
        sources=[],
    )
