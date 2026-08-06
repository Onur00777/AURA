"""Multi-model GGUF manager — scan, cache, and hot-switch local LLMs."""

from __future__ import annotations

import asyncio
import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from aura.config import LLMConfig, load_config
from aura.providers import local_llm as local_api

logger = logging.getLogger(__name__)

_EXECUTOR = ThreadPoolExecutor(max_workers=1, thread_name_prefix="aura-model-mgr")
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_DEFAULT_MODELS_DIR = _PROJECT_ROOT / "models"


@dataclass(frozen=True)
class ModelInfo:
    """Descriptor for a discovered GGUF model."""

    name: str
    path: str
    size_bytes: int = 0

    def as_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "path": self.path,
            "size_bytes": self.size_bytes,
        }


def list_available_models(models_dir: Path | None = None) -> list[ModelInfo]:
    """Scan ``models/`` for ``*.gguf`` files and return sorted descriptors."""
    root = models_dir or _DEFAULT_MODELS_DIR
    if not root.is_dir():
        return []

    found: list[ModelInfo] = []
    for path in sorted(root.glob("*.gguf")):
        try:
            size = path.stat().st_size
        except OSError:
            size = 0
        found.append(
            ModelInfo(
                name=path.name,
                path=str(path.resolve()),
                size_bytes=size,
            )
        )
    return found


def resolve_requested_model(
    requested: str,
    *,
    models_dir: Path | None = None,
) -> Path | None:
    """Resolve a model name or path to an existing GGUF file."""
    root = models_dir or _DEFAULT_MODELS_DIR
    requested = (requested or "").strip().strip('"').strip("'")
    if not requested:
        models = list_available_models(root)
        return Path(models[0].path) if models else None

    # Exact filename match in models/
    by_name = root / requested
    if by_name.is_file():
        return by_name.resolve()

    # Stem match (without .gguf)
    stem = requested[:-5] if requested.lower().endswith(".gguf") else requested
    for info in list_available_models(root):
        path = Path(info.path)
        if path.name == requested or path.stem == stem or path.name.lower() == requested.lower():
            return path

    # Absolute / relative path via existing helper
    return local_api.resolve_model_path(requested, models_dir=root)


class MultiModelManager:
    """Caches loaded GGUF engines and switches on demand.

    Only one engine is kept warm by default (memory-friendly on older Macs).
    Switching to a different model unloads the previous one.
    """

    def __init__(
        self,
        config: LLMConfig | None = None,
        *,
        models_dir: Path | None = None,
        keep_warm: int = 1,
    ) -> None:
        self._config = config or load_config().llm
        self._models_dir = models_dir or _DEFAULT_MODELS_DIR
        self._keep_warm = max(1, keep_warm)
        self._engines: dict[str, local_api.LocalLlamaEngine] = {}
        self._active_key: str | None = None
        self._lock = threading.RLock()

    @property
    def active_model(self) -> str | None:
        return self._active_key

    def list_models(self) -> list[ModelInfo]:
        """Return discovered GGUF models under ``models/``."""
        return list_available_models(self._models_dir)

    def _engine_for(self, model_path: Path) -> local_api.LocalLlamaEngine:
        key = str(model_path.resolve())
        with self._lock:
            engine = self._engines.get(key)
            if engine is not None:
                self._active_key = model_path.name
                return engine

            # Evict least-recent engines if over cache budget.
            while len(self._engines) >= self._keep_warm:
                old_key, old_engine = next(iter(self._engines.items()))
                logger.info("Unloading cached model: %s", Path(old_key).name)
                old_engine.unload()
                del self._engines[old_key]

            n_ctx = max(2048, int(self._config.n_ctx or 2048))
            temperature = float(self._config.temperature)
            engine = local_api.LocalLlamaEngine(
                model_path,
                n_ctx=n_ctx,
                n_threads=self._config.n_threads,
                n_gpu_layers=self._config.n_gpu_layers,
                n_batch=self._config.n_batch,
                max_tokens=self._config.max_tokens,
                temperature=temperature,
            )
            engine.load()
            self._engines[key] = engine
            self._active_key = model_path.name
            logger.info("Active model switched to: %s (n_ctx=%d, temp=%.2f)", model_path.name, n_ctx, temperature)
            return engine

    def complete_blocking(
        self,
        message: str,
        *,
        model: str = "",
        system: str = "",
        history: list[dict[str, str]] | None = None,
    ) -> dict[str, Any]:
        """Generate a reply with the requested model (blocking)."""
        path = resolve_requested_model(model, models_dir=self._models_dir)
        if path is None:
            available = [m.name for m in self.list_models()]
            raise FileNotFoundError(
                f"Model not found: {model!r}. Available: {available or 'none'}"
            )

        engine = self._engine_for(path)
        system_prompt = system or self._config.system_prompt
        result = engine.complete(message, system=system_prompt, history=history)
        return {
            "reply": result["text"],
            "model_used": path.name,
            "usage": result["usage"],
            "raw": result["raw"],
        }

    def complete_messages_blocking(
        self,
        messages: list[dict[str, str]],
        *,
        model: str = "",
    ) -> dict[str, Any]:
        """Generate a reply from a full chat ``messages`` array (blocking)."""
        path = resolve_requested_model(model, models_dir=self._models_dir)
        if path is None:
            available = [m.name for m in self.list_models()]
            raise FileNotFoundError(
                f"Model not found: {model!r}. Available: {available or 'none'}"
            )

        engine = self._engine_for(path)
        result = engine.complete_messages(messages)
        return {
            "reply": result["text"],
            "model_used": path.name,
            "usage": result["usage"],
            "raw": result["raw"],
        }

    async def complete(
        self,
        message: str,
        *,
        model: str = "",
        system: str = "",
        history: list[dict[str, str]] | None = None,
    ) -> dict[str, Any]:
        """Async wrapper around ``complete_blocking``."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            _EXECUTOR,
            lambda: self.complete_blocking(
                message,
                model=model,
                system=system,
                history=history,
            ),
        )

    async def complete_messages(
        self,
        messages: list[dict[str, str]],
        *,
        model: str = "",
    ) -> dict[str, Any]:
        """Async wrapper around ``complete_messages_blocking``."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            _EXECUTOR,
            lambda: self.complete_messages_blocking(messages, model=model),
        )

    def shutdown(self) -> None:
        """Unload all cached engines."""
        with self._lock:
            for key, engine in list(self._engines.items()):
                engine.unload()
                logger.debug("Unloaded %s", Path(key).name)
            self._engines.clear()
            self._active_key = None
