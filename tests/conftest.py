"""Pytest fixtures and environment setup."""

import sys
import os
from pathlib import Path
import pytest

# Ensure source and backend paths are importable
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root / "src"))
sys.path.insert(0, str(project_root))

# Set test environment variables if not set
os.environ.setdefault("OPENAI_API_KEY", "test-key-mock")
os.environ.setdefault("OPENAI_BASE_URL", "https://api.openai.com/v1")
os.environ.setdefault("OPENAI_MODEL", "gpt-4o-mini")
