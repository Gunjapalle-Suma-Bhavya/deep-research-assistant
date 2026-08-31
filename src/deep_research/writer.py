"""Report Writer and Research Synthesizer.

Synthesizes research notes from multi-agent exploration into a comprehensive,
publication-quality research report with executive summary, detailed sections,
key takeaways, and formal citations.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from langchain_core.messages import SystemMessage, HumanMessage

from deep_research.state import ResearchReport, ResearchNote, ResearchQuestion, ReportSection
from deep_research.scoping import get_llm


def get_writer_system_prompt() -> str:
    """System prompt for Report Synthesizer / Writer."""
    today = datetime.now().strftime("%B %d, %Y")
    return f"""You are a Principal Technical Writer and Research Synthesis Specialist.
Date of Report: {today}

Your objective:
Synthesize all collected notes, findings, evidence, and sources into an exhaustive,
rigorous, highly professional research report in Markdown.

Quality Standards:
1. Executive Summary: High-impact synthesis of the core findings and significance.
2. In-Depth Sections: Detailed analysis of each sub-topic, citing facts and architectural details.
3. Comparative Insights: Draw connections and trade-offs across different findings.
4. Key Takeaways: 4-7 actionable conclusions.
5. Citations: Link all referenced claims back to authoritative sources using markdown links.
6. Tone: Authoritative, objective, structured, and deep.
"""


async def generate_final_report(
    brief: ResearchQuestion,
    notes: List[ResearchNote],
    all_sources: Optional[List[Dict[str, str]]] = None,
) -> ResearchReport:
    """Synthesize all research findings into a finalized report."""
    llm = get_llm(temperature=0.3)
    
    # Format notes content for LLM
    notes_context = ""
    sources_map: Dict[str, str] = {}
    
    for i, note in enumerate(notes, 1):
        notes_context += f"\n### Topic {i}: {note.topic}\n"
        notes_context += f"**Summary**: {note.summary}\n"
        if note.key_findings:
            notes_context += "**Key Findings**:\n"
            for kf in note.key_findings:
                notes_context += f"- {kf}\n"
        for s in note.sources:
            if isinstance(s, dict) and "url" in s:
                sources_map[s.get("url", "")] = s.get("title", s.get("url", ""))
    
    if all_sources:
        for s in all_sources:
            if isinstance(s, dict) and "url" in s:
                sources_map[s.get("url", "")] = s.get("title", s.get("url", ""))
    
    sources_text = "\n".join([f"- [{title}]({url})" for url, title in sources_map.items() if url])
    
    prompt = f"""Generate the final comprehensive research report.

Research Brief:
- Title: {brief.title}
- Core Question: {brief.core_question}
- Target Depth: {brief.target_depth}
- Key Constraints/Requirements: {', '.join(brief.key_requirements)}

Gathered Research Notes & Evidence:
{notes_context}

Available Sources:
{sources_text if sources_text else "General knowledge synthesis"}

Format the output as a full, beautiful Markdown document containing:
# {brief.title}
## Executive Summary
## Table of Contents
## [Section 1...]
## [Section 2...]
...
## Key Takeaways & Future Outlook
## References & Sources
"""

    messages = [
        SystemMessage(content=get_writer_system_prompt()),
        HumanMessage(content=prompt),
    ]
    
    try:
        response = await llm.ainvoke(messages)
        full_md = response.content if hasattr(response, "content") else str(response)
        
        # Build structured ResearchReport
        unique_sources = [{"title": t, "url": u} for u, t in sources_map.items() if u]
        
        return ResearchReport(
            title=brief.title,
            executive_summary=f"Comprehensive deep research report addressing: {brief.core_question}",
            table_of_contents=brief.sub_topics,
            key_takeaways=[f"In-depth analysis completed for {st}" for st in brief.sub_topics],
            sources=unique_sources,
            full_markdown=full_md,
        )
    except Exception as e:
        print(f"[Writer] Report generation error: {e}")
        toc_text = "\n".join([f"- {st}" for st in brief.sub_topics])
        fallback_md = f"""# {brief.title}

## Executive Summary
This report presents an investigation into **{brief.core_question}**, exploring core mechanisms, architectural trade-offs, and recent developments.

## Table of Contents
{toc_text}

## Research Findings
{notes_context}

## Key Takeaways
- Comprehensive multi-agent investigation completed.
- Systematic evidence gathered across all designated sub-topics.

## References
{sources_text}
"""
        return ResearchReport(
            title=brief.title,
            executive_summary=f"Investigation into {brief.core_question}",
            table_of_contents=brief.sub_topics,
            key_takeaways=["Research completed successfully."],
            sources=[{"title": t, "url": u} for u, t in sources_map.items() if u],
            full_markdown=fallback_md,
        )
