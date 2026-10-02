"""MongoDB Database Client and Hybrid Storage Manager."""

import os
import json
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from backend.app.config import settings

LOCAL_USERS_FILE = settings.DATA_DIR / "users.json"


class MongoDBManager:
    """Manages Async Motor client connection with resilient local fallback."""

    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
        self.connected: bool = False
        self._init_local_storage()

    def _init_local_storage(self):
        """Ensure local json files exist for seamless fallback."""
        settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
        if not LOCAL_USERS_FILE.exists():
            with open(LOCAL_USERS_FILE, "w", encoding="utf-8") as f:
                json.dump([], f)

    async def connect(self):
        """Connect to MongoDB cluster if URI is configured."""
        uri = settings.MONGODB_URI
        if not uri or "<db_password>" in uri:
            self.connected = False
            return False

        try:
            import certifi
            self.client = AsyncIOMotorClient(
                uri,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=4000,
                connectTimeoutMS=4000,
            )
            # Lightweight ping
            await asyncio.wait_for(self.client.admin.command("ping"), timeout=4.0)
            self.db = self.client[settings.MONGODB_DB_NAME]
            self.connected = True
            
            # Ensure unique index on users.email
            await self.db.users.create_index("email", unique=True)
            print("MongoDB Atlas: Connected and operational.")
            return True
        except Exception as e:
            self.connected = False
            print(f"MongoDB Atlas: Offline/Access pending ({str(e)[:90]}). Using resilient local storage fallback.")
            return False

    async def disconnect(self):
        """Close MongoDB connection pool."""
        if self.client:
            self.client.close()
            self.connected = False

    # --- User Storage Operations (Dual-Mode: MongoDB or Local JSON) ---

    async def find_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Find user by email address."""
        clean_email = email.strip().lower()
        if self.connected and self.db is not None:
            try:
                user = await self.db.users.find_one({"email": clean_email})
                if user:
                    user["id"] = str(user.pop("_id", ""))
                    return user
            except Exception:
                pass

        # Fallback to local storage
        users = self._read_local_users()
        for u in users:
            if u.get("email") == clean_email:
                return u
        return None

    async def find_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Find user by id."""
        if self.connected and self.db is not None:
            try:
                from bson import ObjectId
                user = await self.db.users.find_one({"_id": ObjectId(user_id)})
                if user:
                    user["id"] = str(user.pop("_id", ""))
                    return user
            except Exception:
                pass

        users = self._read_local_users()
        for u in users:
            if u.get("id") == user_id:
                return u
        return None

    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new user account."""
        user_data["email"] = user_data["email"].strip().lower()
        if self.connected and self.db is not None:
            try:
                res = await self.db.users.insert_one(user_data)
                user_data["id"] = str(res.inserted_id)
                user_data.pop("_id", None)
                return user_data
            except Exception:
                pass

        # Local storage fallback
        import uuid
        user_data["id"] = str(uuid.uuid4())
        users = self._read_local_users()
        users.append(user_data)
        self._write_local_users(users)
        return user_data

    async def update_user(self, user_id: str, updates: Dict[str, Any]) -> bool:
        """Update existing user."""
        if self.connected and self.db is not None:
            try:
                from bson import ObjectId
                await self.db.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})
                return True
            except Exception:
                pass

        users = self._read_local_users()
        for u in users:
            if u.get("id") == user_id:
                u.update(updates)
                self._write_local_users(users)
                return True
        return False

    def _read_local_users(self) -> List[Dict[str, Any]]:
        try:
            if LOCAL_USERS_FILE.exists():
                with open(LOCAL_USERS_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception:
            pass
        return []

    def _write_local_users(self, users: List[Dict[str, Any]]):
        try:
            with open(LOCAL_USERS_FILE, "w", encoding="utf-8") as f:
                json.dump(users, f, indent=2, ensure_ascii=False)
        except Exception:
            pass


mongo_manager = MongoDBManager()
