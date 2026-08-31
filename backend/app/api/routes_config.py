"""Configuration, Settings, and System Health API Routes."""

import os
import time
import asyncio
from typing import Dict, Any
from fastapi import APIRouter, HTTPException

from backend.app.config import settings
from backend.app.schemas import (
    ConfigUpdateRequest,
    ConfigResponse,
    ConnectionTestRequest,
    ConnectionTestResponse,
)

router = APIRouter(prefix="/api", tags=["System"])


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "deep-research-assistant",
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "tavily_configured": bool(settings.TAVILY_API_KEY),
        "model": settings.OPENAI_MODEL,
        "demo_mode": settings.DEMO_MODE,
    }


@router.get("/config", response_model=ConfigResponse)
async def get_config():
    """Retrieve current runtime configuration with masked API keys."""
    return ConfigResponse(
        openai_configured=bool(settings.OPENAI_API_KEY),
        openai_masked_key=settings.mask_key(settings.OPENAI_API_KEY),
        openai_base_url=settings.OPENAI_BASE_URL,
        openai_model=settings.OPENAI_MODEL,
        tavily_configured=bool(settings.TAVILY_API_KEY),
        tavily_masked_key=settings.mask_key(settings.TAVILY_API_KEY),
        search_provider=settings.SEARCH_PROVIDER,
        demo_mode=settings.DEMO_MODE,
    )


@router.post("/config", response_model=ConfigResponse)
async def update_config(payload: ConfigUpdateRequest):
    """Update runtime LLM and search configuration."""
    settings.update(
        openai_api_key=payload.openai_api_key,
        openai_base_url=payload.openai_base_url,
        openai_model=payload.openai_model,
        tavily_api_key=payload.tavily_api_key,
        search_provider=payload.search_provider,
        demo_mode=payload.demo_mode,
    )

    return ConfigResponse(
        openai_configured=bool(settings.OPENAI_API_KEY),
        openai_masked_key=settings.mask_key(settings.OPENAI_API_KEY),
        openai_base_url=settings.OPENAI_BASE_URL,
        openai_model=settings.OPENAI_MODEL,
        tavily_configured=bool(settings.TAVILY_API_KEY),
        tavily_masked_key=settings.mask_key(settings.TAVILY_API_KEY),
        search_provider=settings.SEARCH_PROVIDER,
        demo_mode=settings.DEMO_MODE,
    )


@router.post("/config/test", response_model=ConnectionTestResponse)
async def test_connection(payload: ConnectionTestRequest):
    """Test connectivity to the configured LLM endpoint and search provider."""
    # Resolve parameters to test (use payload values or fallback to active settings)
    api_key = payload.openai_api_key if payload.openai_api_key is not None else settings.OPENAI_API_KEY
    base_url = payload.openai_base_url if payload.openai_base_url is not None else settings.OPENAI_BASE_URL
    model_name = payload.openai_model if payload.openai_model is not None else settings.OPENAI_MODEL
    tavily_key = payload.tavily_api_key if payload.tavily_api_key is not None else settings.TAVILY_API_KEY

    llm_connected = False
    llm_msg = ""
    llm_latency: int = 0

    # 1. Test LLM Connection
    if not api_key or not api_key.strip():
        llm_connected = False
        llm_msg = "OpenAI API Key is empty. Configure an API key or use Demo Mode."
    else:
        start_t = time.perf_counter()
        try:
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(
                model=model_name or "gpt-4o-mini",
                openai_api_key=api_key.strip(),
                openai_api_base=base_url or "https://api.openai.com/v1",
                max_tokens=5,
                timeout=8.0,
            )
            # Lightweight invocation
            res = await asyncio.wait_for(llm.ainvoke("Respond with 'OK' only."), timeout=8.0)
            llm_latency = int((time.perf_counter() - start_t) * 1000)
            llm_connected = True
            llm_msg = f"Connected successfully to {model_name} ({llm_latency}ms)."
        except asyncio.TimeoutError:
            llm_connected = False
            llm_msg = "LLM request timed out after 8s."
        except Exception as e:
            llm_connected = False
            err_str = str(e)
            if "Incorrect API key" in err_str or "AuthenticationError" in err_str:
                llm_msg = "Authentication failed: Invalid API key."
            elif "Connection refused" in err_str:
                llm_msg = f"Connection refused at base URL {base_url}."
            else:
                llm_msg = f"LLM error: {err_str[:120]}"

    # 2. Test Search Connection
    search_connected = False
    search_msg = ""
    search_latency: int = 0

    search_start = time.perf_counter()
    try:
        from deep_research.tools import search_web
        if tavily_key and tavily_key.strip():
            orig_tavily = os.environ.get("TAVILY_API_KEY", "")
            os.environ["TAVILY_API_KEY"] = tavily_key.strip()
            results = await asyncio.wait_for(search_web("LangGraph AI", max_results=2), timeout=6.0)
            os.environ["TAVILY_API_KEY"] = orig_tavily
            search_latency = int((time.perf_counter() - search_start) * 1000)
            if results:
                search_connected = True
                search_msg = f"Tavily Search operational ({len(results)} results in {search_latency}ms)."
            else:
                search_connected = True
                search_msg = f"DuckDuckGo fallback operational ({search_latency}ms)."
        else:
            results = await asyncio.wait_for(search_web("LangGraph AI", max_results=2), timeout=6.0)
            search_latency = int((time.perf_counter() - search_start) * 1000)
            search_connected = True
            search_msg = f"DuckDuckGo Free Search operational ({len(results)} results in {search_latency}ms)."
    except Exception as e:
        search_connected = False
        search_msg = f"Search test failed: {str(e)[:100]}"

    return ConnectionTestResponse(
        llm_connected=llm_connected,
        llm_message=llm_msg,
        llm_latency_ms=llm_latency if llm_connected else None,
        search_connected=search_connected,
        search_message=search_msg,
        search_latency_ms=search_latency if search_connected else None,
    )

