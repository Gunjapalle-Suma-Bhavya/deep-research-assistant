"""Storage service for persisting research sessions, reports, and logs."""

import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
from backend.app.config import settings


class TaskStorage:
    """JSON file-backed persistent storage for research tasks."""

    def __init__(self, storage_dir: Optional[Path] = None):
        self.storage_dir = storage_dir or settings.HISTORY_DIR
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self._memory_cache: Dict[str, Dict[str, Any]] = {}
        self._load_all_to_cache()

    def _load_all_to_cache(self):
        """Preload all task summaries into memory cache."""
        try:
            for file_path in self.storage_dir.glob("*.json"):
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        task_id = data.get("task_id")
                        if task_id:
                            self._memory_cache[task_id] = data
                except Exception as e:
                    print(f"[Storage] Error reading {file_path}: {e}")
        except Exception as e:
            print(f"[Storage] Error during cache initialization: {e}")

    def save_task(self, task_data: Dict[str, Any]) -> None:
        """Save or update a task record with dual-write to local storage and MongoDB Atlas."""
        task_id = task_data.get("task_id")
        if not task_id:
            raise ValueError("Task data must contain 'task_id'.")
        
        task_data["updated_at"] = datetime.now().isoformat()
        if "created_at" not in task_data:
            task_data["created_at"] = task_data["updated_at"]
        
        self._memory_cache[task_id] = task_data
        
        file_path = self.storage_dir / f"{task_id}.json"
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(task_data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[Storage] Failed to save task {task_id} to disk: {e}")

        # Seamless async sync to MongoDB collection
        try:
            import asyncio
            from backend.app.db.mongodb import mongo_manager
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(mongo_manager.save_research_task(dict(task_data)))
            except RuntimeError:
                pass
        except Exception as e:
            print(f"[Storage] Note syncing task to MongoDB: {e}")

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve full task data by ID."""
        if task_id in self._memory_cache:
            return self._memory_cache[task_id]
        
        file_path = self.storage_dir / f"{task_id}.json"
        if file_path.exists():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._memory_cache[task_id] = data
                    return data
            except Exception as e:
                print(f"[Storage] Error loading task {task_id}: {e}")
        return None

    def list_tasks(self) -> List[Dict[str, Any]]:
        """List all research tasks sorted by last updated timestamp."""
        tasks = list(self._memory_cache.values())
        tasks.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        return tasks

    def delete_task(self, task_id: str) -> bool:
        """Delete a task and its stored artifact."""
        if task_id in self._memory_cache:
            del self._memory_cache[task_id]
        
        file_path = self.storage_dir / f"{task_id}.json"
        deleted = False
        if file_path.exists():
            try:
                file_path.unlink()
                deleted = True
            except Exception as e:
                print(f"[Storage] Error deleting {file_path}: {e}")
        else:
            deleted = True

        try:
            import asyncio
            from backend.app.db.mongodb import mongo_manager
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(mongo_manager.delete_research_task(task_id))
            except RuntimeError:
                pass
        except Exception:
            pass

        return deleted

    def delete_tasks_by_user(self, user_id: str) -> int:
        """Delete all tasks belonging strictly to a specific user and return the count deleted."""
        if not user_id:
            return 0
        task_ids_to_delete = [
            tid for tid, task in list(self._memory_cache.items())
            if str(task.get("user_id", "")) == str(user_id)
        ]
        count = 0
        for tid in task_ids_to_delete:
            if self.delete_task(tid):
                count += 1
        return count

    def clear_all(self) -> int:
        """Delete all saved research tasks and return the count deleted."""
        count = 0
        self._memory_cache.clear()
        try:
            for file_path in self.storage_dir.glob("*.json"):
                try:
                    file_path.unlink()
                    count += 1
                except Exception as e:
                    print(f"[Storage] Error deleting {file_path}: {e}")
        except Exception as e:
            print(f"[Storage] Error clearing storage: {e}")
        return count


storage = TaskStorage()

