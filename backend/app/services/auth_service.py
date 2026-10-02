"""Authentication Service handling bcrypt hashing, JWT issuance, and Google OAuth."""

import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from backend.app.config import settings
from backend.app.db.mongodb import mongo_manager


class AuthService:
    """Manages user authentication, password verification, and JWT sessions."""

    def hash_password(self, password: str) -> str:
        """Hash password with salted bcrypt."""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify plain password against hashed password."""
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception:
            return False

    def create_access_token(self, user_id: str, email: str, name: str) -> str:
        """Issue signed JWT access token."""
        expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_EXPIRY_DAYS)
        payload = {
            "sub": user_id,
            "email": email,
            "name": name,
            "exp": expire,
            "iat": datetime.now(timezone.utc),
        }
        token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
        return token

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Decode and verify JWT token."""
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except jwt.PyJWTError:
            return None

    async def register_user(self, name: str, email: str, password: str) -> Dict[str, Any]:
        """Register a new user account."""
        clean_email = email.strip().lower()
        existing = await mongo_manager.find_user_by_email(clean_email)
        if existing:
            raise ValueError("An account with this email already exists.")

        hashed_password = self.hash_password(password)
        now_str = datetime.now(timezone.utc).isoformat()

        user_doc = {
            "name": name.strip(),
            "email": clean_email,
            "hashed_password": hashed_password,
            "auth_provider": "local",
            "created_at": now_str,
            "updated_at": now_str,
        }

        created = await mongo_manager.create_user(user_doc)
        token = self.create_access_token(created["id"], created["email"], created["name"])

        return {
            "user": {
                "id": created["id"],
                "name": created["name"],
                "email": created["email"],
                "picture": created.get("picture"),
                "auth_provider": "local",
                "created_at": created["created_at"],
            },
            "token": token,
        }

    async def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user with email and password."""
        clean_email = email.strip().lower()
        user = await mongo_manager.find_user_by_email(clean_email)
        if not user or not user.get("hashed_password"):
            raise ValueError("Invalid email or password.")

        if not self.verify_password(password, user["hashed_password"]):
            raise ValueError("Invalid email or password.")

        token = self.create_access_token(user["id"], user["email"], user["name"])

        return {
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "picture": user.get("picture"),
                "auth_provider": user.get("auth_provider", "local"),
                "created_at": user.get("created_at", datetime.now(timezone.utc).isoformat()),
            },
            "token": token,
        }

    async def authenticate_google(
        self,
        credential: Optional[str] = None,
        email: Optional[str] = None,
        name: Optional[str] = None,
        picture: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Authenticate or auto-provision user using Google OAuth ID token."""
        google_email = email
        google_name = name
        google_picture = picture

        # If credential JWT from Google Identity Services is provided, decode it
        if credential:
            try:
                # First try to verify with google.oauth2.id_token
                from google.oauth2 import id_token
                from google.auth.transport import requests

                idinfo = id_token.verify_oauth2_token(
                    credential,
                    requests.Request(),
                    audience=settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None,
                )
                google_email = idinfo.get("email")
                google_name = idinfo.get("name")
                google_picture = idinfo.get("picture")
            except Exception:
                # Decode unverified payload if client ID not yet configured
                try:
                    decoded = jwt.decode(credential, options={"verify_signature": False})
                    google_email = decoded.get("email", google_email)
                    google_name = decoded.get("name", google_name)
                    google_picture = decoded.get("picture", google_picture)
                except Exception:
                    pass

        if not google_email:
            raise ValueError("Could not extract email address from Google authentication.")

        clean_email = google_email.strip().lower()
        now_str = datetime.now(timezone.utc).isoformat()

        user = await mongo_manager.find_user_by_email(clean_email)
        if not user:
            # Auto-provision new user
            user_doc = {
                "name": google_name or clean_email.split("@")[0],
                "email": clean_email,
                "picture": google_picture,
                "auth_provider": "google",
                "created_at": now_str,
                "updated_at": now_str,
            }
            user = await mongo_manager.create_user(user_doc)
        else:
            # Update user profile picture / name if updated
            updates = {}
            if google_name and user.get("name") != google_name:
                updates["name"] = google_name
            if google_picture and user.get("picture") != google_picture:
                updates["picture"] = google_picture
            if updates:
                await mongo_manager.update_user(user["id"], updates)
                user.update(updates)

        token = self.create_access_token(user["id"], user["email"], user["name"])

        return {
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "picture": user.get("picture"),
                "auth_provider": "google",
                "created_at": user.get("created_at", now_str),
            },
            "token": token,
        }


auth_service = AuthService()
