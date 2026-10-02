"""Authentication API Routes for User Registration, Login, and Google OAuth."""

from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from backend.app.schemas import (
    UserSignUpRequest,
    UserLoginRequest,
    GoogleAuthRequest,
    UserResponse,
    TokenResponse,
)
from backend.app.services.auth_service import auth_service
from backend.app.db.mongodb import mongo_manager
from backend.app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Dependency extracting and verifying the JWT Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")

    token = authorization.split(" ")[1]
    payload = auth_service.verify_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid or expired session token.")

    user = await mongo_manager.find_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    return user


@router.get("/status")
async def get_auth_system_status():
    """Retrieve database connectivity and OAuth setup status."""
    return {
        "mongodb_connected": mongo_manager.connected,
        "database_name": settings.MONGODB_DB_NAME,
        "google_auth_configured": bool(settings.GOOGLE_CLIENT_ID),
        "google_client_id": settings.GOOGLE_CLIENT_ID,
    }


@router.post("/signup", response_model=TokenResponse)
async def signup_endpoint(payload: UserSignUpRequest):
    """Register a new user account with email and password."""
    try:
        result = await auth_service.register_user(
            name=payload.name,
            email=payload.email,
            password=payload.password,
        )
        return TokenResponse(
            access_token=result["token"],
            token_type="bearer",
            user=UserResponse(**result["user"]),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/login", response_model=TokenResponse)
async def login_endpoint(payload: UserLoginRequest):
    """Authenticate existing user with email and password."""
    try:
        result = await auth_service.authenticate_user(
            email=payload.email,
            password=payload.password,
        )
        return TokenResponse(
            access_token=result["token"],
            token_type="bearer",
            user=UserResponse(**result["user"]),
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")


@router.post("/google", response_model=TokenResponse)
async def google_auth_endpoint(payload: GoogleAuthRequest):
    """Authenticate or auto-provision user using Google OAuth."""
    try:
        result = await auth_service.authenticate_google(
            credential=payload.credential,
            email=payload.email,
            name=payload.name,
            picture=payload.picture,
        )
        return TokenResponse(
            access_token=result["token"],
            token_type="bearer",
            user=UserResponse(**result["user"]),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google authentication failed: {str(e)}")


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(user: Dict[str, Any] = Depends(get_current_user)):
    """Fetch current user profile from authenticated session."""
    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        picture=user.get("picture"),
        auth_provider=user.get("auth_provider", "local"),
        created_at=user.get("created_at", ""),
    )
