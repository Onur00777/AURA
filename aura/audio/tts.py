"""Cross-platform text-to-speech engine (async wrapper around pyttsx3)."""

from __future__ import annotations

import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Final

import pyttsx3

from aura.config import AudioConfig
from aura.core.events import Event, EventBus, EventType

logger = logging.getLogger(__name__)

_EXECUTOR: Final[ThreadPoolExecutor] = ThreadPoolExecutor(max_workers=1, thread_name_prefix="aura-tts")


class TTSEngine:
    """Non-blocking TTS facade.

    pyttsx3 is inherently synchronous and platform-specific.  We isolate
    all blocking calls in a dedicated single-thread executor so the asyncio
    event loop stays responsive.
    """

    def __init__(
        self,
        config: AudioConfig,
        event_bus: EventBus | None = None,
    ) -> None:
        self._config = config
        self._bus = event_bus
        self._engine: pyttsx3.Engine | None = None
        self._lock = asyncio.Lock()

    def _init_engine(self) -> pyttsx3.Engine:
        """Lazily initialize the pyttsx3 engine (must run off event loop)."""
        if self._engine is not None:
            return self._engine

        engine = pyttsx3.init()
        engine.setProperty("rate", self._config.tts_rate)
        engine.setProperty("volume", self._config.tts_volume)

        # Prefer a clear voice when multiple are available.
        voices = engine.getProperty("voices")
        if voices:
            preferred = next(
                (v for v in voices if "english" in v.name.lower() or "en" in v.id.lower()),
                voices[0],
            )
            engine.setProperty("voice", preferred.id)
            logger.debug("TTS voice selected: %s", preferred.name)

        self._engine = engine
        return engine

    def _speak_blocking(self, text: str) -> None:
        """Blocking speak — runs inside the executor thread."""
        engine = self._init_engine()
        engine.say(text)
        engine.runAndWait()

    async def speak(self, text: str) -> None:
        """Synthesize and play *text* without blocking the event loop.

        Args:
            text: Utterance to speak aloud.

        Raises:
            RuntimeError: If the TTS engine fails to initialize or speak.
        """
        if not text.strip():
            return

        async with self._lock:
            if self._bus:
                await self._bus.publish(
                    Event(type=EventType.TTS_STARTED, payload={"text": text})
                )

            logger.info("Speaking: %s", text[:80] + ("…" if len(text) > 80 else ""))

            loop = asyncio.get_running_loop()
            try:
                await loop.run_in_executor(_EXECUTOR, self._speak_blocking, text)
            except Exception as exc:
                logger.error("TTS speak failed: %s", exc)
                if self._bus:
                    await self._bus.publish(
                        Event(type=EventType.ERROR, payload={"source": "tts", "error": str(exc)})
                    )
                raise RuntimeError(f"TTS speak failed: {exc}") from exc

            if self._bus:
                await self._bus.publish(Event(type=EventType.TTS_COMPLETED, payload={"text": text}))

    async def health_check(self) -> bool:
        """Verify the TTS engine can initialize."""
        loop = asyncio.get_running_loop()
        try:
            await loop.run_in_executor(_EXECUTOR, self._init_engine)
            return True
        except Exception as exc:
            logger.warning("TTS health check failed: %s", exc)
            return False

    async def shutdown(self) -> None:
        """Release TTS resources."""
        if self._engine is None:
            return

        loop = asyncio.get_running_loop()

        def _stop() -> None:
            if self._engine is not None:
                try:
                    self._engine.stop()
                except Exception:
                    pass

        await loop.run_in_executor(_EXECUTOR, _stop)
        self._engine = None
        logger.debug("TTS engine shut down")
