#!/usr/bin/env python3
"""Deep Research Assistant Launcher.

Starts the FastAPI backend server and serves the modern Single-Page Application (SPA) frontend.
Includes friendly environment diagnostics and Python version validation.
"""

import sys
import os
import glob
from pathlib import Path

# Verify Python version (LangChain and LangGraph require Python 3.10+)
if sys.version_info < (3, 10):
    print("\n" + "=" * 70)
    print("  ⚠️  PYTHON VERSION COMPATIBILITY NOTICE")
    print("=" * 70)
    print(f"  Detected Python version: {sys.version.split()[0]}")
    print("  LangGraph and Modern AI packages require Python 3.10, 3.11, or 3.12.")
    print("\n  👉 Recommended steps:")
    print("     1. Install Python 3.11 or 3.12 (or uv)")
    print("     2. Create a virtual environment:")
    print("        python3.11 -m venv .venv")
    print("        source .venv/bin/activate")
    print("        pip install -r requirements.txt")
    print("     3. Re-run:")
    print("        python run.py")
    print("=" * 70 + "\n")
    sys.exit(1)

# Add project root and src to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT / "src"))
sys.path.insert(0, str(PROJECT_ROOT))

# Auto-detect matching virtual environment site-packages
py_ver_str = f"python{sys.version_info.major}.{sys.version_info.minor}"
possible_venv_patterns = [
    PROJECT_ROOT / ".venv" / "lib" / py_ver_str / "site-packages",
    PROJECT_ROOT.parent / ".venv" / "lib" / py_ver_str / "site-packages",
    PROJECT_ROOT / "venv" / "lib" / py_ver_str / "site-packages",
]

for sp_path in possible_venv_patterns:
    sp_str = str(sp_path)
    if os.path.exists(sp_str) and sp_str not in sys.path:
        sys.path.insert(0, sp_str)

# Check for required packages with friendly diagnostics
MISSING_DEPS = []

try:
    import fastapi
except ImportError:
    MISSING_DEPS.append("fastapi")

try:
    import uvicorn
except ImportError:
    MISSING_DEPS.append("uvicorn")

try:
    import sse_starlette
except ImportError:
    MISSING_DEPS.append("sse-starlette")

try:
    import langchain
except ImportError:
    MISSING_DEPS.append("langchain")

try:
    import langgraph
except ImportError:
    MISSING_DEPS.append("langgraph")

if MISSING_DEPS:
    print("\n" + "=" * 70)
    print("  ❌ MISSING DEPENDENCIES DETECTED")
    print("=" * 70)
    print(f"  The following required packages are not installed in your Python environment:")
    for dep in MISSING_DEPS:
        print(f"    • {dep}")
    print("\n  👉 To install all dependencies, run:")
    print("     pip install -r requirements.txt")
    print("=" * 70 + "\n")
    sys.exit(1)

import webbrowser
import time
import socket
from dotenv import load_dotenv

# Load environment configuration
env_file = PROJECT_ROOT / ".env"
parent_env = PROJECT_ROOT.parent / ".env"

if env_file.exists():
    load_dotenv(dotenv_path=env_file)
elif parent_env.exists():
    load_dotenv(dotenv_path=parent_env)
else:
    load_dotenv()


def is_port_in_use(host: str, port: int) -> bool:
    """Check if a TCP port is currently occupied."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0


def find_available_port(host: str, starting_port: int = 8000, max_tries: int = 10) -> int:
    """Find the first available port starting from starting_port."""
    for p in range(starting_port, starting_port + max_tries):
        if not is_port_in_use(host, p):
            return p
    return starting_port


def main():
    """Launch server and open web frontend."""
    host = os.getenv("HOST", "127.0.0.1")
    requested_port = int(os.getenv("PORT", "8000"))
    
    port = find_available_port(host, requested_port)
    url = f"http://{host}:{port}"

    api_key_set = bool(os.getenv("OPENAI_API_KEY"))
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    print("=" * 70)
    print("  🚀 DEEP RESEARCH MULTI-AGENT ASSISTANT")
    print("  Scope • Research • Synthesize")
    print("=" * 70)
    print(f"  • Web UI:     {url}")
    print(f"  • API Docs:   {url}/docs")
    print(f"  • Base URL:   {base_url}")
    print(f"  • Model:      {model_name}")
    print(f"  • API Key:    {'✅ Configured in .env' if api_key_set else '⚠️  Not set in .env'}")
    if port != requested_port:
        print(f"  • Notice:     Port {requested_port} was in use; switched to port {port}.")
    print("=" * 70)
    print("  Press CTRL+C to stop the server.\n")

    # Open browser in a separate thread after short delay
    def open_browser():
        time.sleep(1.2)
        try:
            webbrowser.open(url)
        except Exception:
            pass

    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    import uvicorn
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    main()
