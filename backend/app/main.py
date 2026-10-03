"""FastAPI Application Entry Point for Deep Research Assistant."""

import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Ensure project root is in python path
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root / "src"))
sys.path.insert(0, str(project_root))

from backend.app.config import settings
from backend.app.api.routes_research import router as research_router
from backend.app.api.routes_config import router as config_router
from backend.app.api.routes_auth import router as auth_router
from backend.app.db.mongodb import mongo_manager

app = FastAPI(
    title="Deep Research Multi-Agent Assistant",
    description="A multi-agent deep research system powered by LangGraph, FastAPI, and OpenAI-compatible models",
    version="1.0.0",
)

@app.on_event("startup")
async def startup_event():
    """Initialize MongoDB connection pool on startup."""
    await mongo_manager.connect()

@app.on_event("shutdown")
async def shutdown_event():
    """Disconnect MongoDB on shutdown."""
    await mongo_manager.disconnect()

# Enable CORS for frontend flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(research_router)
app.include_router(config_router)
app.include_router(auth_router)

@app.get("/health")
async def root_health_check():
    """Deployment platform health check endpoint (Render, Railway, Fly.io)."""
    return {"status": "ok", "service": "deep-research-assistant"}

# Mount Frontend: Modern React distribution (dist) with fallback to legacy
dist_dir = project_root / "frontend" / "dist"
assets_dir = dist_dir / "assets"
legacy_dir = project_root / "frontend_legacy"

if dist_dir.exists() and (dist_dir / "index.html").exists():
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/")
    async def serve_index():
        """Serve modern React SPA index."""
        return FileResponse(dist_dir / "index.html")

    @app.get("/{full_path:path}")
    async def catch_all_spa(full_path: str):
        """SPA fallback for client routes and assets."""
        if full_path.startswith("api/"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = dist_dir / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(dist_dir / "index.html")

elif legacy_dir.exists():
    app.mount("/static", StaticFiles(directory=str(legacy_dir)), name="static")

    @app.get("/")
    async def serve_legacy():
        return FileResponse(legacy_dir / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
