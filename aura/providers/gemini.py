"""Google Gemini (AI Studio) REST helpers via generativelanguage.googleapis.com."""

from __future__ import annotations

import base64
import logging
from typing import Any

import aiohttp

logger = logging.getLogger(__name__)

DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_MODEL = "gemini-1.5-flash"


def normalize_model(model: str) -> str:
    """Return a bare Gemini model id suitable for v1beta REST URLs."""
    candidate = (model or DEFAULT_MODEL).strip()
    if not candidate:
        return DEFAULT_MODEL

    if candidate.startswith("models/"):
        candidate = candidate[len("models/") :]

    if ":" in candidate:
        candidate = candidate.split(":", 1)[0]

    candidate = candidate.strip("/")

    return candidate or DEFAULT_MODEL


def generate_url(base_url: str, model: str, api_key: str) -> str:
    """Build a ``:generateContent`` URL with API-key query auth."""
    root = (base_url or DEFAULT_BASE_URL).rstrip("/")
    return f"{root}/models/{normalize_model(model)}:generateContent?key={api_key}"


def models_url(base_url: str, api_key: str) -> str:
    """Build a model-list URL for health checks."""
    root = (base_url or DEFAULT_BASE_URL).rstrip("/")
    return f"{root}/models?key={api_key}"


async def health_check(session: aiohttp.ClientSession, *, api_key: str, base_url: str = "") -> bool:
    """Return True when the Gemini API accepts the key."""
    try:
        async with session.get(models_url(base_url, api_key)) as resp:
            if resp.status == 200:
                return True
            body = await resp.text()
            logger.warning("Gemini health check HTTP %d: %s", resp.status, body[:200])
            return False
    except Exception as exc:
        logger.warning("Gemini health check failed: %s", exc)
        return False


def extract_text(data: dict[str, Any]) -> str:
    """Pull concatenated text parts from a generateContent response."""
    candidates = data.get("candidates") or []
    if not candidates:
        # Blocked / empty responses often land in promptFeedback.
        feedback = data.get("promptFeedback") or {}
        reason = feedback.get("blockReason") or data.get("error", {}).get("message", "empty")
        raise RuntimeError(f"Gemini returned no candidates ({reason})")

    parts = candidates[0].get("content", {}).get("parts") or []
    texts = [str(p.get("text", "")) for p in parts if "text" in p]
    return "".join(texts).strip()


def build_chat_payload(
    prompt: str,
    *,
    system: str = "",
    history: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    """Map OpenAI-style history into Gemini ``contents`` + ``systemInstruction``."""
    contents: list[dict[str, Any]] = []

    for turn in history or []:
        role = turn.get("role", "user")
        text = turn.get("content", "")
        if not text:
            continue
        gemini_role = "model" if role in {"assistant", "model"} else "user"
        contents.append({"role": gemini_role, "parts": [{"text": text}]})

    contents.append({"role": "user", "parts": [{"text": prompt}]})

    payload: dict[str, Any] = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 512,
        },
    }
    if system.strip():
        payload["systemInstruction"] = {"parts": [{"text": system}]}
    return payload


def build_transcribe_payload(wav: bytes, *, language: str = "") -> dict[str, Any]:
    """Build a Gemini audio-transcription request using inlineData audio bytes."""
    lang_hint = f" The spoken language is {language}." if language else ""
    prompt = (
        "Transcribe the speech in this audio exactly. "
        "Return only the spoken words with no commentary, labels, or quotation marks."
        f"{lang_hint}"
    )
    audio_b64 = base64.b64encode(wav).decode("ascii")
    return {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": prompt},
                    {"inlineData": {"mimeType": "audio/wav", "data": audio_b64}},
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0.0,
            "maxOutputTokens": 1024,
        },
    }


async def generate_content(
    session: aiohttp.ClientSession,
    *,
    api_key: str,
    model: str,
    payload: dict[str, Any],
    base_url: str = "",
) -> dict[str, Any]:
    """POST to Gemini generateContent and return the JSON body."""
    url = generate_url(base_url, model, api_key)
    async with session.post(url, json=payload) as resp:
        data = await resp.json(content_type=None)
        if resp.status >= 400:
            message = data.get("error", {}).get("message") if isinstance(data, dict) else str(data)
            raise RuntimeError(f"HTTP {resp.status}: {message or str(data)[:300]}")
        if not isinstance(data, dict):
            raise RuntimeError("Unexpected Gemini response type")
        return data
