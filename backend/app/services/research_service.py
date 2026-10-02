"""Research orchestration service managing background tasks and SSE streaming."""

import asyncio
import json
import uuid
from typing import Dict, Any, Optional, AsyncGenerator
from datetime import datetime

from backend.app.services.storage import storage
from deep_research.state import ScopingState, SupervisorState, ClarifyWithUser, ResearchQuestion
from deep_research.scoping import check_clarification, generate_research_brief
from deep_research.supervisor import supervisor_plan_node
from deep_research.research_agent import run_single_research_topic
from deep_research.writer import generate_final_report


class ResearchService:
    """Manages multi-agent deep research workflows and real-time event broadcasting."""

    def __init__(self):
        # Active event queues for SSE subscribers: {task_id: [asyncio.Queue, ...]}
        self._subscribers: Dict[str, list[asyncio.Queue]] = {}
        # Active background asyncio Tasks for cancellation: {task_id: asyncio.Task}
        self._running_tasks: Dict[str, asyncio.Task] = {}

    def _get_or_create_queues(self, task_id: str) -> list[asyncio.Queue]:
        if task_id not in self._subscribers:
            self._subscribers[task_id] = []
        return self._subscribers[task_id]

    async def cancel_task(self, task_id: str) -> bool:
        """Cancel a running research background task."""
        task_obj = self._running_tasks.get(task_id)
        if task_obj and not task_obj.done():
            task_obj.cancel()
        
        task_data = storage.get_task(task_id)
        if task_data:
            task_data["status"] = "cancelled"
            storage.save_task(task_data)
        
        await self.broadcast_event(
            task_id,
            "cancelled",
            {"message": "Research task was cancelled by user.", "task_id": task_id},
        )
        return True


    async def broadcast_event(self, task_id: str, event_type: str, data: Dict[str, Any]):
        """Publish a real-time event to all connected SSE clients."""
        payload = {
            "task_id": task_id,
            "event": event_type,
            "timestamp": datetime.now().isoformat(),
            "data": data,
        }
        
        # Also append to task activity_logs in storage
        task = storage.get_task(task_id)
        if task:
            if "activity_logs" not in task:
                task["activity_logs"] = []
            task["activity_logs"].append({
                "type": event_type,
                "timestamp": payload["timestamp"],
                "message": data.get("message", ""),
                "details": data,
            })
            storage.save_task(task)

        queues = self._subscribers.get(task_id, [])
        for q in list(queues):
            try:
                await q.put(payload)
            except Exception as e:
                print(f"[ResearchService] Error putting event to queue: {e}")

    async def event_generator(self, task_id: str) -> AsyncGenerator[str, None]:
        """Async generator yielding SSE formatted data strings for a given task."""
        queue: asyncio.Queue = asyncio.Queue()
        queues = self._get_or_create_queues(task_id)
        queues.append(queue)

        try:
            # Yield initial connection heartbeat
            yield f"event: ping\ndata: {json.dumps({'status': 'connected'})}\n\n"

            while True:
                try:
                    # Wait for next event with timeout
                    event = await asyncio.wait_for(queue.get(), timeout=25.0)
                    yield f"event: {event.get('event', 'message')}\ndata: {json.dumps(event)}\n\n"
                    
                    if event.get("event") in ["completed", "failed", "waiting_for_clarification"]:
                        # Keep connection alive for potential follow-up or end
                        pass
                except asyncio.TimeoutError:
                    # Send keep-alive ping
                    yield f"event: ping\ndata: {json.dumps({'ping': True})}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if queue in queues:
                queues.remove(queue)

    async def start_research(
        self,
        query: str,
        depth: str = "comprehensive",
        custom_instructions: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> str:
        """Start a new deep research workflow in the background."""
        task_id = str(uuid.uuid4())[:8]
        now = datetime.now().isoformat()

        initial_task = {
            "task_id": task_id,
            "user_id": user_id,
            "query": query,
            "depth": depth,
            "custom_instructions": custom_instructions,
            "status": "scoping",
            "progress_percentage": 10,
            "created_at": now,
            "updated_at": now,
            "clarification_needed": False,
            "clarification_questions": [],
            "clarification_reasoning": "",
            "research_brief": None,
            "research_notes": [],
            "sources": [],
            "final_report": None,
            "activity_logs": [],
        }
        storage.save_task(initial_task)

        # Launch background execution
        task_coro = asyncio.create_task(self._run_scoping_phase(task_id, query, depth, custom_instructions))
        self._running_tasks[task_id] = task_coro
        return task_id


    async def _run_scoping_phase(
        self,
        task_id: str,
        query: str,
        depth: str,
        custom_instructions: Optional[str],
    ):
        """Execute Phase 1: Clarification and Brief Generation."""
        try:
            await self.broadcast_event(
                task_id,
                "node_transition",
                {"node": "scoping", "message": "Analyzing research query and scoping requirements..."},
            )

            scoping_state = ScopingState(user_query=query)
            clarif_result = await check_clarification(scoping_state)
            clarif: ClarifyWithUser = clarif_result.get("clarification")

            task = storage.get_task(task_id) or {}
            
            if clarif and clarif.needs_clarification:
                task["status"] = "waiting_for_clarification"
                task["clarification_needed"] = True
                task["clarification_questions"] = clarif.clarification_questions
                task["clarification_reasoning"] = clarif.reasoning
                task["progress_percentage"] = 25
                storage.save_task(task)

                await self.broadcast_event(
                    task_id,
                    "waiting_for_clarification",
                    {
                        "questions": clarif.clarification_questions,
                        "reasoning": clarif.reasoning,
                        "message": "Clarification required to narrow down research scope.",
                    },
                )
                return

            # If no clarification needed, generate brief directly
            await self.broadcast_event(
                task_id,
                "brief_generating",
                {"message": "Query is well-specified. Synthesizing formal research brief..."},
            )

            brief_result = await generate_research_brief(scoping_state)
            brief: ResearchQuestion = brief_result.get("research_brief")

            task["status"] = "brief_ready"
            task["research_brief"] = brief.model_dump()
            task["progress_percentage"] = 35
            storage.save_task(task)

            await self.broadcast_event(
                task_id,
                "brief_ready",
                {
                    "brief": brief.model_dump(),
                    "message": f"Research brief created: '{brief.title}' with {len(brief.sub_topics)} sub-topics.",
                },
            )

            # Proceed immediately to Phase 2: Multi-Agent Research
            await self._run_research_and_writing_phase(task_id, brief)

        except Exception as e:
            print(f"[ResearchService] Error in scoping phase: {e}")
            task = storage.get_task(task_id) or {}
            task["status"] = "failed"
            task["error"] = str(e)
            storage.save_task(task)
            await self.broadcast_event(
                task_id, "failed", {"error": str(e), "message": f"Scoping failed: {e}"}
            )

    async def submit_clarification(
        self,
        task_id: str,
        responses: Dict[str, str],
        additional_notes: Optional[str] = None,
    ) -> bool:
        """Resume research workflow after user answers clarification questions."""
        task = storage.get_task(task_id)
        if not task:
            return False

        task["status"] = "resuming_scoping"
        task["progress_percentage"] = 30
        storage.save_task(task)

        # Format user response text
        user_response_parts = []
        for q_idx, ans in responses.items():
            user_response_parts.append(f"Q: {q_idx} -> Answer: {ans}")
        if additional_notes:
            user_response_parts.append(f"Additional context: {additional_notes}")
        combined_response = "\n".join(user_response_parts)

        await self.broadcast_event(
            task_id,
            "clarification_received",
            {"message": "Clarification answers received. Generating final research brief..."},
        )

        async def _resume():
            try:
                scoping_state = ScopingState(
                    user_query=task["query"],
                    user_response=combined_response,
                )
                brief_result = await generate_research_brief(scoping_state)
                brief: ResearchQuestion = brief_result.get("research_brief")

                task["research_brief"] = brief.model_dump()
                task["progress_percentage"] = 40
                storage.save_task(task)

                await self.broadcast_event(
                    task_id,
                    "brief_ready",
                    {
                        "brief": brief.model_dump(),
                        "message": f"Research brief finalized: '{brief.title}'",
                    },
                )

                await self._run_research_and_writing_phase(task_id, brief)
            except Exception as e:
                print(f"[ResearchService] Error resuming research: {e}")
                task["status"] = "failed"
                task["error"] = str(e)
                storage.save_task(task)
                await self.broadcast_event(
                    task_id, "failed", {"error": str(e), "message": f"Failed during brief generation: {e}"}
                )

        asyncio.create_task(_resume())
        return True

    async def _run_research_and_writing_phase(self, task_id: str, brief: ResearchQuestion):
        """Execute Phase 2 (Supervisor + Parallel Subagents) and Phase 3 (Writer)."""
        try:
            # 1. Supervisor Planning
            await self.broadcast_event(
                task_id,
                "node_transition",
                {"node": "supervisor", "message": "Research Supervisor planning parallel delegation..."},
            )

            supervisor_state = SupervisorState(research_brief=brief)
            plan_result = await supervisor_plan_node(supervisor_state)
            tasks_list = plan_result.get("delegated_tasks", [])

            await self.broadcast_event(
                task_id,
                "supervisor_plan",
                {
                    "tasks_count": len(tasks_list),
                    "tasks": tasks_list,
                    "message": f"Supervisor launched {len(tasks_list)} concurrent sub-researchers.",
                },
            )

            # 2. Parallel Subagent Research
            await self.broadcast_event(
                task_id,
                "node_transition",
                {"node": "parallel_researchers", "message": "Sub-researchers searching and synthesizing in parallel..."},
            )

            completed_notes = []
            all_sources = []
            seen_urls = set()

            async def _run_sub_researcher(idx: int, t: Dict[str, Any]):
                topic = t.get("topic", f"Topic {idx+1}")
                queries = t.get("search_queries", [topic])
                
                await self.broadcast_event(
                    task_id,
                    "subagent_start",
                    {"topic": topic, "queries": queries, "message": f"Subagent #{idx+1} investigating '{topic}'"},
                )

                note = await run_single_research_topic(
                    topic=topic,
                    queries=queries,
                    depth=t.get("depth", "in-depth"),
                )

                await self.broadcast_event(
                    task_id,
                    "subagent_complete",
                    {
                        "topic": topic,
                        "key_findings": note.key_findings,
                        "sources_count": len(note.sources),
                        "message": f"Subagent #{idx+1} completed research for '{topic}'",
                    },
                )
                return note

            # Execute parallel subagents
            notes_results = await asyncio.gather(
                *[_run_sub_researcher(i, t) for i, t in enumerate(tasks_list)],
                return_exceptions=False,
            )

            for note in notes_results:
                completed_notes.append(note.model_dump())
                for s in note.sources:
                    u = s.get("url", "")
                    if u and u not in seen_urls:
                        seen_urls.add(u)
                        all_sources.append(s)

            task = storage.get_task(task_id) or {}
            task["research_notes"] = completed_notes
            task["sources"] = all_sources
            task["progress_percentage"] = 80
            storage.save_task(task)

            # 3. Report Synthesis (Writer)
            await self.broadcast_event(
                task_id,
                "node_transition",
                {"node": "writer", "message": "Report Writer synthesizing findings into comprehensive Markdown report..."},
            )

            # Generate final markdown report
            final_report_obj = await generate_final_report(
                brief=brief,
                notes=[note for note in notes_results],
                all_sources=all_sources,
            )

            task["status"] = "completed"
            task["final_report"] = final_report_obj.model_dump()
            task["progress_percentage"] = 100
            storage.save_task(task)

            await self.broadcast_event(
                task_id,
                "completed",
                {
                    "report": final_report_obj.model_dump(),
                    "message": "Deep Research completed successfully! Final report is ready.",
                },
            )

        except Exception as e:
            print(f"[ResearchService] Research/Writing execution error: {e}")
            task = storage.get_task(task_id) or {}
            task["status"] = "failed"
            task["error"] = str(e)
            storage.save_task(task)
            await self.broadcast_event(
                task_id, "failed", {"error": str(e), "message": f"Execution error: {e}"}
            )


research_service = ResearchService()
