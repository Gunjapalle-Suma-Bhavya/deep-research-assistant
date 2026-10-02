"""Configuration management for Deep Research Assistant."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root or parent directories
project_root = Path(__file__).resolve().parent.parent.parent
env_candidates = [
    project_root / ".env",
    project_root.parent / ".env",
    Path.cwd() / ".env",
]

for env_path in env_candidates:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=False)
        break


class Settings:
    """Application Settings."""

    # LLM Settings (OpenAI-compatible endpoints: OpenAI, AI credits, DeepSeek, OpenRouter, Ollama)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # Search Tool Settings
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    SEARCH_PROVIDER: str = os.getenv("SEARCH_PROVIDER", "auto")  # 'auto', 'tavily', 'duckduckgo'

    # ElevenLabs Audio Settings
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
    ELEVENLABS_VOICE_ID: str = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Default: Rachel

    # Server Settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Database & Authentication Settings
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "deep_research_db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "classic-editorial-jwt-secret-key-2026-secure")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_DAYS: int = 7
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")

    # Project Directories
    PROJECT_ROOT: Path = project_root
    DATA_DIR: Path = project_root / "data"
    HISTORY_DIR: Path = DATA_DIR / "history"
    EXPORTS_DIR: Path = DATA_DIR / "exports"

    # Demo Mode
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "false").lower() in ("true", "1", "yes")

    # LangSmith Observability
    LANGCHAIN_TRACING_V2: str = os.getenv("LANGCHAIN_TRACING_V2", "false")
    LANGSMITH_API_KEY: str = os.getenv("LANGSMITH_API_KEY", "")
    LANGCHAIN_PROJECT: str = os.getenv("LANGCHAIN_PROJECT", "deep-research-assistant")

    def mask_key(self, key: str) -> str:
        """Return a masked representation of an API key for safe display."""
        if not key or not key.strip():
            return ""
        k = key.strip()
        if len(k) <= 8:
            return "••••••••"
        return f"{k[:4]}••••••••{k[-4:]}"

    def update(
        self,
        openai_api_key: str = None,
        openai_base_url: str = None,
        openai_model: str = None,
        tavily_api_key: str = None,
        search_provider: str = None,
        demo_mode: bool = None,
    ):
        """Update runtime settings in memory and system environment."""
        if openai_api_key is not None:
            self.OPENAI_API_KEY = openai_api_key.strip()
            os.environ["OPENAI_API_KEY"] = self.OPENAI_API_KEY
        if openai_base_url is not None:
            self.OPENAI_BASE_URL = openai_base_url.strip()
            os.environ["OPENAI_BASE_URL"] = self.OPENAI_BASE_URL
        if openai_model is not None:
            self.OPENAI_MODEL = openai_model.strip()
            os.environ["OPENAI_MODEL"] = self.OPENAI_MODEL
        if tavily_api_key is not None:
            self.TAVILY_API_KEY = tavily_api_key.strip()
            os.environ["TAVILY_API_KEY"] = self.TAVILY_API_KEY
        if search_provider is not None:
            self.SEARCH_PROVIDER = search_provider.strip()
            os.environ["SEARCH_PROVIDER"] = self.SEARCH_PROVIDER
        if demo_mode is not None:
            self.DEMO_MODE = bool(demo_mode)
            os.environ["DEMO_MODE"] = "true" if self.DEMO_MODE else "false"


settings = Settings()

# Ensure required data directories exist
settings.HISTORY_DIR.mkdir(parents=True, exist_ok=True)
settings.EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

