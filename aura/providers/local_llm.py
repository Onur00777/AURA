"""Fully offline local LLM via llama-cpp-python (GGUF)."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_DEFAULT_MODELS_DIR = _PROJECT_ROOT / "models"


def is_local_provider(provider: str) -> bool:
    """Return True for offline / llama.cpp style providers."""
    return provider.strip().lower() in {
        "local",
        "llama_cpp",
        "llama-cpp",
        "llamacpp",
        "gguf",
        "offline",
    }


def resolve_model_path(configured: str, *, models_dir: Path | None = None) -> Path | None:
    """Resolve a GGUF path from an explicit setting or ``models/`` scan.

    Args:
        configured: ``AURA_LLM_MODEL_PATH`` or a model filename / absolute path.
        models_dir: Directory to scan for ``*.gguf`` files.

    Returns:
        Path to a GGUF file, or ``None`` if nothing is available yet.
    """
    root = models_dir or _DEFAULT_MODELS_DIR
    candidate = (configured or "").strip().strip('"').strip("'")

    if candidate:
        path = Path(candidate).expanduser()
        if not path.is_absolute():
            # Prefer project models/ then CWD-relative.
            for base in (root, Path.cwd(), _PROJECT_ROOT):
                probe = (base / path).resolve()
                if probe.is_file():
                    return probe
            path = path.resolve()
        if path.is_file():
            return path

    if root.is_dir():
        ggufs = sorted(root.glob("*.gguf"))
        if ggufs:
            return ggufs[0]

    return None


def llama_cpp_available() -> bool:
    """Return True when ``llama_cpp`` can be imported."""
    try:
        import llama_cpp  # noqa: F401

        return True
    except Exception:
        return False


class LocalLlamaEngine:
    """Thin wrapper around ``llama_cpp.Llama`` for chat completions."""

    def __init__(
        self,
        model_path: Path,
        *,
        n_ctx: int = 2048,
        n_threads: int = 0,
        n_gpu_layers: int = 0,
        n_batch: int = 256,
        max_tokens: int = 256,
        temperature: float = 0.2,
    ) -> None:
        self.model_path = model_path
        self.n_ctx = max(2048, int(n_ctx))
        self.n_threads = n_threads
        self.n_gpu_layers = n_gpu_layers
        self.n_batch = n_batch
        self.max_tokens = max_tokens
        self.temperature = temperature
        self._llm: Any = None

    def load(self) -> None:
        """Load the GGUF into memory (blocking)."""
        if self._llm is not None:
            return

        from llama_cpp import Llama

        # Keep context large enough that prompt + reply fit comfortably.
        # Force CPU layers on older macOS to avoid Metal context allocation failures.
        kwargs: dict[str, Any] = {
            "model_path": str(self.model_path),
            "n_ctx": self.n_ctx,
            "n_gpu_layers": 0 if self.n_gpu_layers < 0 else self.n_gpu_layers,
            "n_batch": min(self.n_batch, self.n_ctx),
            "logits_all": False,
            "embedding": False,
            "verbose": False,
        }
        if self.n_threads > 0:
            kwargs["n_threads"] = self.n_threads

        logger.info("Loading local GGUF: %s", self.model_path.name)
        self._llm = Llama(**kwargs)
        logger.info("Local LLM ready (%s)", self.model_path.name)

    def complete(
        self,
        prompt: str,
        *,
        system: str = "",
        history: list[dict[str, str]] | None = None,
    ) -> dict[str, Any]:
        """Run a chat completion and return raw llama.cpp result + text."""
        messages: list[dict[str, str]] = []
        if system.strip():
            messages.append({"role": "system", "content": system})
        for turn in history or []:
            role = turn.get("role", "user")
            content = turn.get("content", "")
            if not content:
                continue
            if role not in {"system", "user", "assistant"}:
                role = "user"
            messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": prompt})
        return self.complete_messages(messages)

    def complete_messages(self, messages: list[dict[str, str]]) -> dict[str, Any]:
        """Run a chat completion with a fully built ``messages`` array."""
        self.load()
        assert self._llm is not None

        cleaned: list[dict[str, str]] = []
        for turn in messages:
            role = (turn.get("role") or "user").strip().lower()
            content = (turn.get("content") or "").strip()
            if not content:
                continue
            if role not in {"system", "user", "assistant"}:
                role = "user"
            cleaned.append({"role": role, "content": content})

        if not cleaned:
            raise ValueError("messages must contain at least one non-empty turn")

        result = self._llm.create_chat_completion(
            messages=cleaned,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
        )
        choice = result["choices"][0]["message"]["content"]
        usage = result.get("usage") or {}
        return {
            "text": str(choice).strip(),
            "usage": {
                "prompt_tokens": int(usage.get("prompt_tokens", 0)),
                "completion_tokens": int(usage.get("completion_tokens", 0)),
                "total_tokens": int(usage.get("total_tokens", 0)),
            },
            "raw": result,
        }

    def unload(self) -> None:
        """Drop the model reference so memory can be reclaimed."""
        self._llm = None
