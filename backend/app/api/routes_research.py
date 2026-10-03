"""Research API Routes for initiating, monitoring, and streaming research tasks."""

from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks, Response, Header
from sse_starlette.sse import EventSourceResponse
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI

from backend.app.config import settings
from backend.app.schemas import (
    ResearchStartRequest,
    ClarificationSubmitRequest,
    ResearchTaskSummary,
    ResearchTaskDetail,
    ReportChatRequest,
    ReportChatResponse,
    ChatMessage,
)
from backend.app.services.storage import storage
from backend.app.services.research_service import research_service
from backend.app.services.export_service import generate_html_document
from backend.app.services.auth_service import auth_service

router = APIRouter(prefix="/api/research", tags=["Research"])


@router.post("/start", response_model=Dict[str, Any])
async def start_research_endpoint(
    payload: ResearchStartRequest,
    authorization: Optional[str] = Header(None),
):
    """Initiate a new Deep Research multi-agent workflow."""
    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=400, detail="Research query cannot be empty.")

    user_id = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        decoded = auth_service.verify_token(token)
        if decoded:
            user_id = decoded.get("sub")

    task_id = await research_service.start_research(
        query=payload.query.strip(),
        depth=payload.depth,
        mode=payload.mode,
        custom_instructions=payload.custom_instructions,
        user_id=user_id,
    )

    return {
        "success": True,
        "task_id": task_id,
        "status": "scoping",
        "message": "Research task initialized. Scoping phase in progress.",
    }


@router.post("/clarify", response_model=Dict[str, Any])
async def submit_clarification_endpoint(payload: ClarificationSubmitRequest):
    """Submit user answers to clarifying questions and resume research."""
    task = storage.get_task(payload.task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {payload.task_id} not found.")

    resumed = await research_service.submit_clarification(
        task_id=payload.task_id,
        responses=payload.responses,
        additional_notes=payload.additional_notes,
    )

    if not resumed:
        raise HTTPException(status_code=500, detail="Failed to resume research workflow.")

    return {
        "success": True,
        "task_id": payload.task_id,
        "status": "resumed",
        "message": "Clarification submitted. Research brief generation resuming.",
    }


@router.get("/status/{task_id}", response_model=ResearchTaskDetail)
async def get_task_status(task_id: str):
    """Get complete status, logs, notes, and report of a research task."""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found.")
    return task


@router.get("/stream/{task_id}")
async def stream_task_events(task_id: str):
    """Server-Sent Events (SSE) endpoint for real-time research progress."""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found.")

    return EventSourceResponse(research_service.event_generator(task_id))


@router.get("/history", response_model=List[ResearchTaskSummary])
async def list_research_history(authorization: Optional[str] = Header(None)):
    """List all past research runs sorted by recent activity."""
    user_id = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        decoded = auth_service.verify_token(token)
        if decoded:
            user_id = decoded.get("sub")

    tasks = storage.list_tasks()
    if user_id:
        tasks = [t for t in tasks if t.get("user_id") in (user_id, None, "")]

    summaries = []
    for t in tasks:
        brief = t.get("research_brief") or {}
        title = brief.get("title") or t.get("query", "Untitled Research")[:50]
        summaries.append(
            ResearchTaskSummary(
                task_id=t.get("task_id", ""),
                query=t.get("query", ""),
                title=title,
                status=t.get("status", "unknown"),
                progress_percentage=t.get("progress_percentage", 0),
                created_at=t.get("created_at", ""),
                updated_at=t.get("updated_at", ""),
            )
        )
    return summaries


from backend.app.services.export_service import (
    generate_html_document,
    generate_docx_document,
    generate_bibtex,
)

@router.get("/{task_id}/export/{format_type}")
async def export_research_report(task_id: str, format_type: str):
    """Export the final report in Markdown, HTML, DOCX, BibTeX, or raw JSON format."""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found.")

    final_report = task.get("final_report")
    if not final_report or not final_report.get("full_markdown"):
        raise HTTPException(status_code=400, detail="Research report not yet generated for this task.")

    title = final_report.get("title", "Research_Report")
    clean_filename = "".join(c for c in title if c.isalnum() or c in (" ", "_", "-")).rstrip().replace(" ", "_")
    markdown_content = final_report.get("full_markdown", "")
    sources = task.get("sources", [])

    fmt = format_type.lower()
    if fmt in ("md", "markdown"):
        return Response(
            content=markdown_content,
            media_type="text/markdown; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{clean_filename}.md"'},
        )
    elif fmt == "html":
        html_doc = generate_html_document(title, markdown_content, metadata=task)
        return Response(
            content=html_doc,
            media_type="text/html; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{clean_filename}.html"'},
        )
    elif fmt in ("docx", "word"):
        docx_bytes = generate_docx_document(title, markdown_content, sources)
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{clean_filename}.docx"'},
        )
    elif fmt in ("bib", "bibtex"):
        bibtex_content = generate_bibtex(title, sources)
        return Response(
            content=bibtex_content,
            media_type="application/x-bibtex; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{clean_filename}.bib"'},
        )
    elif fmt == "json":
        import json
        return Response(
            content=json.dumps(task, indent=2, ensure_ascii=False),
            media_type="application/json; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{clean_filename}.json"'},
        )
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported export format '{format_type}'. Use 'md', 'html', 'docx', 'bib', or 'json'.",
        )


@router.post("/{task_id}/share")
async def create_or_toggle_share_link(task_id: str):
    """Generate or retrieve a public read-only share token for a research monograph."""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found.")

    import uuid
    if not task.get("share_token"):
        task["share_token"] = f"pub_{uuid.uuid4().hex[:12]}"
        task["is_shared"] = True
        storage.save_task(task)

    return {
        "success": True,
        "task_id": task_id,
        "share_token": task["share_token"],
        "is_shared": task.get("is_shared", True),
    }


@router.get("/shared/{share_token}")
async def get_shared_monograph(share_token: str):
    """Retrieve public read-only monograph data by share token without requiring auth."""
    # Find task matching share_token
    tasks = storage.list_tasks()
    matched = next((t for t in tasks if t.get("share_token") == share_token and t.get("is_shared")), None)
    if not matched:
        raise HTTPException(status_code=404, detail="Shared monograph not found or access has been revoked.")

    # Return safe public subset
    return {
        "task_id": matched.get("task_id"),
        "query": matched.get("query"),
        "title": matched.get("final_report", {}).get("title") or matched.get("query"),
        "status": matched.get("status"),
        "created_at": matched.get("created_at"),
        "sources": matched.get("sources", []),
        "final_report": matched.get("final_report"),
        "research_brief": matched.get("research_brief"),
        "mode": matched.get("mode", "general"),
        "share_token": share_token,
    }


@router.post("/{task_id}/cancel", response_model=Dict[str, Any])
async def cancel_research_task(task_id: str):
    """Cancel a running research task."""
    cancelled = await research_service.cancel_task(task_id)
    return {"success": True, "task_id": task_id, "message": "Research task cancelled."}


@router.post("/{task_id}/audio")
async def generate_audio_briefing_endpoint(task_id: str):
    """Generate and stream ElevenLabs AI voice audio briefing for a research report."""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found.")

    final_report = task.get("final_report")
    if not final_report or not final_report.get("full_markdown"):
        raise HTTPException(status_code=400, detail="Research report not yet generated for this task.")

    from backend.app.services.elevenlabs_service import generate_audio_briefing

    try:
        audio_path = await generate_audio_briefing(
            task_id=task_id,
            markdown_content=final_report.get("full_markdown", ""),
            title=final_report.get("title", task.get("query")),
        )
        with open(audio_path, "rb") as f:
            audio_bytes = f.read()

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Content-Disposition": f'inline; filename="{task_id}_briefing.mp3"'},
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate ElevenLabs audio briefing: {str(e)}")


@router.get("/{task_id}/chat")
async def get_report_chat_history(task_id: str):
    """Retrieve chat history for inquiries conducted on a completed research monograph."""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found.")
    return {"task_id": task_id, "history": task.get("chat_history", [])}


@router.post("/{task_id}/chat", response_model=ReportChatResponse)
async def chat_with_report(task_id: str, payload: ReportChatRequest):
    """Conduct interactive follow-up Q&A grounded strictly in a completed research monograph."""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found.")

    final_report = task.get("final_report")
    if not final_report or not final_report.get("full_markdown"):
        raise HTTPException(status_code=400, detail="Research report not yet generated for this task.")

    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Inquiry message cannot be empty.")

    user_query = payload.message.strip()
    title = final_report.get("title", task.get("query", "Research Monograph"))
    full_markdown = final_report.get("full_markdown", "")
    sources = task.get("sources", [])

    # Format source summary for grounding context
    sources_summary = "\n".join([
        f"[{i+1}] {s.get('title', 'Unknown')} ({s.get('url', '')}): {s.get('snippet', '')[:250]}"
        for i, s in enumerate(sources[:30])
    ])

    system_prompt = (
        f"You are an expert research fellow and co-author answering follow-up questions strictly regarding the completed monograph:\n"
        f"TITLE: {title}\n"
        f"ORIGINAL QUERY: {task.get('query')}\n\n"
        f"--- MONOGRAPH FULL TEXT ---\n"
        f"{full_markdown}\n\n"
        f"--- PRIMARY SOURCES INDEX ---\n"
        f"{sources_summary}\n\n"
        f"INSTRUCTIONS:\n"
        f"1. Answer the user's question directly, accurately, and thoroughly, grounded strictly in the provided monograph and verified sources.\n"
        f"2. Reference citations with bracketed indices such as [1], [2], etc., matching the monograph when discussing factual claims.\n"
        f"3. If the monograph or sources do not contain the answer, explicitly state that this detail was not covered in the original investigation, and summarize any related context that was found.\n"
        f"4. Maintain an authoritative, scholarly, yet accessible editorial tone. Use markdown formatting for clarity (headings, bold text, bullet points)."
    )

    messages = [SystemMessage(content=system_prompt)]

    # Add historical messages (up to last 10 turns to avoid token overflow)
    for msg in (payload.history or [])[-10:]:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            messages.append(AIMessage(content=msg.content))

    messages.append(HumanMessage(content=user_query))

    try:
        llm = ChatOpenAI(
            model=settings.OPENAI_MODEL,
            openai_api_key=settings.OPENAI_API_KEY,
            openai_api_base=settings.OPENAI_BASE_URL,
            temperature=0.3,
            max_tokens=2000,
        )
        ai_response = await llm.ainvoke(messages)
        answer_text = ai_response.content if hasattr(ai_response, "content") else str(ai_response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Chat inference error: {str(e)}")

    now_iso = datetime.now().isoformat()
    user_chat = ChatMessage(role="user", content=user_query, timestamp=now_iso)
    ai_chat = ChatMessage(role="assistant", content=answer_text, timestamp=now_iso)

    # Persist in task
    chat_history = task.get("chat_history", [])
    chat_history.append(user_chat.model_dump())
    chat_history.append(ai_chat.model_dump())
    task["chat_history"] = chat_history
    storage.save_task(task)

    return ReportChatResponse(
        response=answer_text,
        task_id=task_id,
        timestamp=now_iso,
        history=[ChatMessage(**m) for m in chat_history],
    )


@router.delete("/history/clear", response_model=Dict[str, Any])
async def clear_all_history():
    """Clear all historical research sessions."""
    count = storage.clear_all()
    return {"success": True, "count": count, "message": f"Cleared {count} research sessions."}


@router.delete("/{task_id}", response_model=Dict[str, Any])
async def delete_research_task(task_id: str):
    """Delete a research session and its history."""
    deleted = storage.delete_task(task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found.")
    return {"success": True, "message": f"Task {task_id} deleted successfully."}

