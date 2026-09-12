"""ElevenLabs Text-to-Speech (TTS) integration service.

Converts research report summaries into high-quality AI voice audio briefings.
"""

import os
import re
import httpx
from pathlib import Path
from typing import Optional
from backend.app.config import settings


def clean_markdown_for_speech(markdown_text: str, max_chars: int = 2500) -> str:
    """Clean markdown formatting to create natural spoken text for TTS."""
    if not markdown_text:
        return "No report text available for audio briefing."

    # Try to extract Executive Summary or first section
    exec_summary_match = re.search(r"##\s*Executive Summary\n+(.*?)(?=\n##|\Z)", markdown_text, re.DOTALL | re.IGNORECASE)
    if exec_summary_match:
        text = exec_summary_match.group(1).strip()
    else:
        text = markdown_text

    # Strip Markdown syntax (headers, bold, links, code blocks)
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    text = re.sub(r"`.*?`", "", text)
    text = re.sub(r"#+\s*", "", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"[-*•]\s*", "", text)
    text = re.sub(r"\n+", " ", text).strip()

    # Truncate text to avoid excessive API token costs
    if len(text) > max_chars:
        text = text[:max_chars].rsplit(".", 1)[0] + "."

    return text if text else "Summary report available for review."


async def generate_audio_briefing(
    task_id: str,
    markdown_content: str,
    api_key: Optional[str] = None,
    voice_id: Optional[str] = None,
) -> Path:
    """Generate MP3 audio briefing from report text using ElevenLabs API."""
    key = (api_key or settings.ELEVENLABS_API_KEY or "").strip()
    if not key:
        raise ValueError("ElevenLabs API Key is not configured. Please set ELEVENLABS_API_KEY in .env or Settings.")

    selected_voice = (voice_id or settings.ELEVENLABS_VOICE_ID or "21m00Tcm4TlvDq8ikWAM").strip()
    spoken_text = clean_markdown_for_speech(markdown_content)

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{selected_voice}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "json",
        "xi-api-key": key,
    }
    payload = {
        "text": spoken_text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        if response.status_code != 200:
            err_msg = response.text
            raise RuntimeError(f"ElevenLabs TTS API error ({response.status_code}): {err_msg}")

        audio_bytes = response.content

    # Save MP3 file in exports directory
    output_path = settings.EXPORTS_DIR / f"{task_id}_briefing.mp3"
    with open(output_path, "wb") as f:
        f.write(audio_bytes)

    return output_path
