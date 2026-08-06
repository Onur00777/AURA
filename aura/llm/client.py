"""LLM client — local llama.cpp (default), plus optional Gemini / OpenAI."""

from __future__ import annotations

import logging
from typing import Any

import aiohttp

from aura.config import LLMConfig
from aura.core.events import Event, EventBus, EventType
from aura.llm.base import LLMProvider, LLMResponse
from aura.llm.manager import MultiModelManager
from aura.providers import gemini as gemini_api
from aura.providers import local_llm as local_api

logger = logging.getLogger(__name__)


def _is_gemini(provider: str) -> bool:
    return provider.strip().lower() in {"gemini", "google", "google-ai", "ai-studio"}


def _resolve_gemini_model(model: str) -> str:
    return gemini_api.normalize_model(model or gemini_api.DEFAULT_MODEL)


class LLMClient(LLMProvider):
    """Async LLM facade for local GGUF, Gemini, or OpenAI-compatible APIs.

    Local completions go through ``MultiModelManager`` so callers can switch
    GGUF models at runtime without restarting the process.
    """

    def __init__(
        self,
        config: LLMConfig,
        event_bus: EventBus | None = None,
        model_manager: MultiModelManager | None = None,
    ) -> None:
        self._config = config
        self._bus = event_bus
        self._session: aiohttp.ClientSession | None = None
        self._manager = model_manager or MultiModelManager(config)

    @property
    def model_manager(self) -> MultiModelManager:
        """Shared multi-model GGUF manager."""
        return self._manager

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            timeout = aiohttp.ClientTimeout(total=self._config.timeout_seconds)
            self._session = aiohttp.ClientSession(timeout=timeout)
        return self._session

    async def health_check(self) -> bool:
        """Verify the configured LLM backend is usable."""
        if local_api.is_local_provider(self._config.provider):
            if not local_api.llama_cpp_available():
                logger.warning(
                    "llama-cpp-python is not installed — run: pip install llama-cpp-python"
                )
                return False
            if not self._manager.list_models():
                path = local_api.resolve_model_path(self._config.model_path or self._config.model)
                if path is None:
                    logger.warning(
                        "No GGUF model found. Place a .gguf file in AURA/models/ "
                        "or set AURA_LLM_MODEL_PATH."
                    )
            return True

        if not self._config.api_key:
            logger.info("LLM running in offline stub mode (no API key)")
            return True

        session = await self._get_session()

        if _is_gemini(self._config.provider):
            return await gemini_api.health_check(
                session,
                api_key=self._config.api_key,
                base_url=self._config.base_url,
            )

        try:
            base = self._config.base_url or "https://api.openai.com/v1"
            headers = {"Authorization": f"Bearer {self._config.api_key}"}
            async with session.get(f"{base}/models", headers=headers) as resp:
                ok = resp.status == 200
                if not ok:
                    logger.warning("LLM health check returned HTTP %d", resp.status)
                return ok
        except Exception as exc:
            logger.warning("LLM health check failed: %s", exc)
            return False

    async def complete(
        self,
        prompt: str,
        *,
        system: str = "",
        history: list[dict[str, str]] | None = None,
        model: str = "",
    ) -> LLMResponse:
        """Generate a reply from the configured provider."""
        if self._bus:
            await self._bus.publish(
                Event(type=EventType.LLM_REQUEST, payload={"prompt": prompt[:120]})
            )

        if local_api.is_local_provider(self._config.provider):
            response = await self._complete_local(
                prompt,
                system=system,
                history=history,
                model=model,
            )
        elif not self._config.api_key:
            response = LLMResponse(
                content=(
                    "I heard you, but the language model is not configured. "
                    "Set AURA_LLM_PROVIDER=local and place a GGUF model in models/."
                ),
                model="stub",
            )
        elif _is_gemini(self._config.provider):
            response = await self._complete_gemini(prompt, system=system, history=history)
        else:
            response = await self._complete_openai(prompt, system=system, history=history)

        if self._bus:
            await self._bus.publish(
                Event(type=EventType.LLM_RESPONSE, payload={"content": response.content[:120]})
            )
        return response

    async def _complete_local(
        self,
        prompt: str,
        *,
        system: str = "",
        history: list[dict[str, str]] | None = None,
        model: str = "",
    ) -> LLMResponse:
        """Fully offline completion via the multi-model manager."""
        if not local_api.llama_cpp_available():
            return LLMResponse(
                content=(
                    "Local LLM support is not installed. "
                    "Run pip install llama-cpp-python, then place a GGUF file in the models folder."
                ),
                model="local-missing",
            )

        requested = model or self._config.model_path or self._config.model
        try:
            result = await self._manager.complete(
                prompt,
                model=requested,
                system=system or self._config.system_prompt,
                history=history,
            )
        except FileNotFoundError:
            return LLMResponse(
                content=(
                    "No local GGUF model was found. "
                    "Download a chat GGUF into the AURA models folder."
                ),
                model="local-no-gguf",
            )
        except Exception as exc:
            logger.error("Local LLM failed: %s", exc)
            raise RuntimeError(f"LLM completion failed: {exc}") from exc

        return LLMResponse(
            content=result["reply"],
            model=result["model_used"],
            usage=result.get("usage") or {},
            raw=result.get("raw") or {},
        )

    async def _complete_gemini(
        self,
        prompt: str,
        *,
        system: str = "",
        history: list[dict[str, str]] | None = None,
    ) -> LLMResponse:
        session = await self._get_session()
        payload = gemini_api.build_chat_payload(prompt, system=system, history=history)
        try:
            data = await gemini_api.generate_content(
                session,
                api_key=self._config.api_key,
                model=_resolve_gemini_model(self._config.model),
                payload=payload,
                base_url=self._config.base_url,
            )
            text = gemini_api.extract_text(data)
        except Exception as exc:
            logger.error("Gemini completion failed: %s", exc)
            raise RuntimeError(f"LLM completion failed: {exc}") from exc

        usage_meta = data.get("usageMetadata") or {}
        usage = {
            "prompt_tokens": int(usage_meta.get("promptTokenCount", 0)),
            "completion_tokens": int(usage_meta.get("candidatesTokenCount", 0)),
            "total_tokens": int(usage_meta.get("totalTokenCount", 0)),
        }
        return LLMResponse(
            content=text,
            model=_resolve_gemini_model(self._config.model),
            usage=usage,
            raw=data,
        )

    async def _complete_openai(
        self,
        prompt: str,
        *,
        system: str = "",
        history: list[dict[str, str]] | None = None,
    ) -> LLMResponse:
        session = await self._get_session()
        base = self._config.base_url or "https://api.openai.com/v1"
        headers = {
            "Authorization": f"Bearer {self._config.api_key}",
            "Content-Type": "application/json",
        }
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": prompt})

        payload = {"model": self._config.model, "messages": messages}

        try:
            async with session.post(f"{base}/chat/completions", json=payload, headers=headers) as resp:
                resp.raise_for_status()
                data = await resp.json()
        except Exception as exc:
            logger.error("LLM completion failed: %s", exc)
            raise RuntimeError(f"LLM completion failed: {exc}") from exc

        choice = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})
        return LLMResponse(
            content=choice,
            model=data.get("model", self._config.model),
            usage={k: int(v) for k, v in usage.items()},
            raw=data,
        )

    async def shutdown(self) -> None:
        self._manager.shutdown()
        if self._session and not self._session.closed:
            await self._session.close()
            self._session = None
            logger.debug("LLM client session closed")
