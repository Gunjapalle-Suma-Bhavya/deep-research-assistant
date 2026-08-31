"""Search and summarization tools for Deep Research Multi-Agent system."""

import os
import re
import asyncio
from typing import Dict, List, Optional, Any
import httpx
from bs4 import BeautifulSoup
from langchain_core.tools import tool
from deep_research.state import SearchResult

# Optional Tavily client
try:
    from tavily import TavilyClient
    HAS_TAVILY = True
except ImportError:
    HAS_TAVILY = False

# Optional DuckDuckGo search
try:
    from duckduckgo_search import DDGS
    HAS_DDG = True
except ImportError:
    HAS_DDG = False


async def tavily_search(query: str, max_results: int = 5) -> List[SearchResult]:
    """Execute search query using Tavily API."""
    api_key = os.getenv("TAVILY_API_KEY", "").strip()
    if not api_key:
        return []
    
    try:
        client = TavilyClient(api_key=api_key)
        # Tavily python SDK search
        response = client.search(
            query=query,
            max_results=max_results,
            search_depth="advanced",
            include_raw_content=False,
        )
        
        results = []
        for item in response.get("results", []):
            results.append(
                SearchResult(
                    title=item.get("title", "No Title"),
                    url=item.get("url", ""),
                    snippet=item.get("content", ""),
                    content=item.get("raw_content") or item.get("content", ""),
                )
            )
        return results
    except Exception as e:
        print(f"[Tools] Tavily search error: {e}")
        return []


def duckduckgo_search_sync(query: str, max_results: int = 5) -> List[SearchResult]:
    """Execute search query using DuckDuckGo (sync)."""
    if not HAS_DDG:
        # Fallback to simple HTML search scraping if library missing
        return []
    
    try:
        ddgs = DDGS()
        raw_results = list(ddgs.text(query, max_results=max_results))
        results = []
        for item in raw_results:
            results.append(
                SearchResult(
                    title=item.get("title", "No Title"),
                    url=item.get("href", ""),
                    snippet=item.get("body", ""),
                    content=item.get("body", ""),
                )
            )
        return results
    except Exception as e:
        print(f"[Tools] DuckDuckGo search error: {e}")
        return []


async def search_web(query: str, max_results: int = 5) -> List[SearchResult]:
    """Search the web with Tavily if API key is present, otherwise fallback to DuckDuckGo."""
    tavily_key = os.getenv("TAVILY_API_KEY", "").strip()
    if tavily_key and HAS_TAVILY:
        results = await tavily_search(query, max_results=max_results)
        if results:
            return results
    
    # Fallback to DuckDuckGo in thread pool
    return await asyncio.to_thread(duckduckgo_search_sync, query, max_results)


async def fetch_page_content(url: str, timeout: int = 8) -> str:
    """Fetch text content from a web page."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
    }
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                # Remove scripts, styles, navigations
                for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                    tag.decompose()
                text = soup.get_text(separator=" ", strip=True)
                # Clean multiple spaces
                text = re.sub(r"\s+", " ", text)
                return text[:4000]  # Cap at 4000 chars for context efficiency
    except Exception as e:
        print(f"[Tools] Web fetch error for {url}: {e}")
    return ""


async def summarize_content(text: str, topic: str, llm: Optional[Any] = None) -> str:
    """Compress and summarize text content focusing on key findings for a topic."""
    if len(text) < 400:
        return text
    
    if llm is None:
        # Simple extraction if no LLM provided
        return text[:500] + "..."
    
    prompt = (
        f"Extract 3-5 concise, factual bullet points related to '{topic}' "
        f"from the following text:\n\n{text[:3000]}\n\n"
        "Bullet Points:"
    )
    try:
        response = await llm.ainvoke(prompt)
        return response.content if hasattr(response, "content") else str(response)
    except Exception as e:
        print(f"[Tools] Summarization error: {e}")
        return text[:400] + "..."


# ==============================================================================
# LangChain Tools for ReAct Agent
# ==============================================================================

@tool
async def tavily_search_tool(query: str) -> str:
    """Search the web for relevant, up-to-date information on a specific research query."""
    results = await search_web(query, max_results=5)
    if not results:
        return f"No results found for query: '{query}'."
    
    formatted = []
    for i, res in enumerate(results, 1):
        formatted.append(
            f"[{i}] {res.title}\nURL: {res.url}\nSummary: {res.snippet}\n"
        )
    return "\n".join(formatted)


@tool
async def duckduckgo_search_tool(query: str) -> str:
    """Search DuckDuckGo for public web pages, articles, and research sources."""
    results = await asyncio.to_thread(duckduckgo_search_sync, query, 5)
    if not results:
        return f"No results found on DuckDuckGo for: '{query}'."
    
    formatted = []
    for i, res in enumerate(results, 1):
        formatted.append(
            f"[{i}] {res.title}\nURL: {res.url}\nSummary: {res.snippet}\n"
        )
    return "\n".join(formatted)


def get_search_tool():
    """Return the primary search tool based on configuration."""
    tavily_key = os.getenv("TAVILY_API_KEY", "").strip()
    if tavily_key:
        return tavily_search_tool
    return duckduckgo_search_tool
