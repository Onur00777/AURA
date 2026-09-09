#!/usr/bin/env python3
"""AURA multi-model HTTP backend.

Endpoints:
  GET  /api/models  — list GGUF files in models/
  POST /api/chat    — multi-turn chat (full ``messages`` array)

Run:
  uvicorn server:app --host 127.0.0.1 --port 8000
  # or
  python server.py
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Any, List, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from aura.config import load_config
from aura.llm.manager import MultiModelManager
from aura.utils.logging import setup_logging

logger = logging.getLogger(__name__)

_config = load_config()
_manager = MultiModelManager(_config.llm)

AURA_CHAT_SYSTEM_PROMPT = (
    "You are AURA, an intelligent AI assistant. "
    "Always maintain context from previous turns."
)

AURA_ENGINEERING_SYSTEM_PROMPT = (
    "You are AURA CompE (beta): a Computer Engineering teaching assistant. "
    "You only tutor CE: C/C++, data structures, algorithms, computer organization, "
    "OS, networks, databases, digital logic, embedded systems, software engineering.\n"
    "RULES:\n"
    "1. Match the user's language (Turkish or English). Keep answers compact.\n"
    "2. Be factually conservative. If unsure, say so. Never invent fake taxonomies "
    "(e.g. do NOT call arrays '2D structures' vs pointers '1D').\n"
    "3. Off-topic (sports, cooking, celebrities, general chit-chat): first sentence "
    "must be that this is CompE mode and you will not answer that topic; then offer "
    "one CE-related door if any. Do not answer the off-topic question itself.\n"
    "4. Homework: hints and a small example, not a full graded solution.\n"
    "5. Core facts you must not contradict:\n"
    "- In C, an array is a contiguous block of elements; a pointer is a variable "
    "that stores an address. Arrays are not pointers, though they decay to a "
    "pointer to the first element in many expressions.\n"
    "- A context switch is the OS saving one thread/process register state and "
    "loading another so the CPU can run a different task.\n"
    "Do not repeat the same sentence. Remember prior turns in this thread."
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    setup_logging(_config.log_level)
    logger.info(
        "AURA API starting (n_ctx=%d, temperature=%.2f)",
        max(2048, _config.llm.n_ctx),
        _config.llm.temperature,
    )
    try:
        yield
    finally:
        _manager.shutdown()
        logger.info("AURA API shut down")


app = FastAPI(
    title="AURA Multi-Model API",
    description="Local GGUF model listing and chat backend for AURA.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    """One conversation turn."""

    role: str
    content: str


class ChatRequest(BaseModel):
    """Body for ``POST /api/chat``."""

    model: str = Field(..., min_length=1, description="GGUF filename or path")
    messages: List[Message] = Field(
        ...,
        min_length=1,
        description="Full active-session history including the latest user turn",
    )
    mode: Literal["general", "engineering"] = Field(
        default="general",
        description="Workspace persona: general chat or Computer Engineering (beta)",
    )


class ChatResponse(BaseModel):
    """Body returned by ``POST /api/chat``."""

    reply: str
    model_used: str


@app.get("/api/models")
async def get_models() -> dict[str, Any]:
    """Scan ``models/`` and return available GGUF models."""
    models = [m.as_dict() for m in _manager.list_models()]
    return {
        "models": models,
        "count": len(models),
        "active_model": _manager.active_model,
        "defaults": {
            "n_ctx": max(2048, _config.llm.n_ctx),
            "temperature": _config.llm.temperature,
        },
    }


@app.post("/api/chat", response_model=ChatResponse)
async def post_chat(request: ChatRequest) -> ChatResponse:
    """Generate a reply with full multi-turn context via create_chat_completion."""
    formatted: list[dict[str, str]] = [
        {"role": msg.role, "content": msg.content} for msg in request.messages
    ]

    has_system = any(
        (m.get("role") or "").strip().lower() == "system" for m in formatted
    )
    if not has_system:
        system = (
            AURA_ENGINEERING_SYSTEM_PROMPT
            if request.mode == "engineering"
            else AURA_CHAT_SYSTEM_PROMPT
        )
        formatted = [{"role": "system", "content": system}, *formatted]

    logger.info(
        "Chat request model=%s mode=%s turns=%d",
        request.model,
        request.mode,
        len(formatted),
    )

    try:
        result = await _manager.complete_messages(
            formatted,
            model=request.model,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Chat failed: %s", exc, exc_info=exc)
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {exc}") from exc

    return ChatResponse(
        reply=result["reply"],
        model_used=result["model_used"],
    )


@app.get("/health")
async def health() -> dict[str, Any]:
    """Simple liveness probe."""
    return {
        "status": "ok",
        "models": len(_manager.list_models()),
        "active_model": _manager.active_model,
    }


def main() -> None:
    """Run with uvicorn when invoked as ``python server.py``."""
    import uvicorn

    uvicorn.run(
        "server:app",
        host=os.getenv("AURA_API_HOST", "127.0.0.1"),
        port=int(os.getenv("AURA_API_PORT", "8000")),
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    main()
