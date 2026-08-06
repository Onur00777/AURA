"""STT client — fully local SpeechRecognition/PocketSphinx by default."""

from __future__ import annotations

import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor

import aiohttp
import speech_recognition as sr

from aura.audio.vad import Utterance
from aura.config import STTConfig
from aura.core.events import Event, EventBus, EventType
from aura.stt.base import STTProvider, Transcription

logger = logging.getLogger(__name__)

_EXECUTOR = ThreadPoolExecutor(max_workers=1, thread_name_prefix="aura-stt")


def _is_local(provider: str) -> bool:
    return provider.strip().lower() in {"local", "speech_recognition", "sphinx"}


class STTClient(STTProvider):
    """Async speech-to-text via Gemini (AI Studio) or OpenAI Whisper."""

    def __init__(
        self,
        config: STTConfig,
        event_bus: EventBus | None = None,
    ) -> None:
        self._config = config
        self._bus = event_bus
        self._session: aiohttp.ClientSession | None = None
        self._recognizer = sr.Recognizer()

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            timeout = aiohttp.ClientTimeout(total=self._config.timeout_seconds)
            self._session = aiohttp.ClientSession(timeout=timeout)
        return self._session

    async def health_check(self) -> bool:
        """Pass in stub mode; otherwise verify the configured provider."""
        if _is_local(self._config.provider):
            try:
                import pocketsphinx  # noqa: F401
                return True
            except Exception as exc:
                logger.warning("Local STT health check failed: %s", exc)
                return False

        if not self._config.api_key:
            logger.info("STT running in offline stub mode (no API key)")
            return True

        session = await self._get_session()

        try:
            base = self._config.base_url or "https://api.openai.com/v1"
            headers = {"Authorization": f"Bearer {self._config.api_key}"}
            async with session.get(f"{base}/models", headers=headers) as resp:
                ok = resp.status == 200
                if not ok:
                    logger.warning("STT health check returned HTTP %d", resp.status)
                return ok
        except Exception as exc:
            logger.warning("STT health check failed: %s", exc)
            return False

    async def transcribe(self, utterance: Utterance) -> Transcription:
        """Transcribe PCM audio to text."""
        if _is_local(self._config.provider):
            result = await self._transcribe_local(utterance)
        else:
            result = await self._transcribe_remote(utterance)

        if self._bus and not result.is_empty:
            await self._bus.publish(
                Event(
                    type=EventType.TRANSCRIPTION_READY,
                    payload={"text": result.text[:200], "provider": result.provider},
                )
            )
        return result

    async def _transcribe_local(self, utterance: Utterance) -> Transcription:
        """Transcribe speech locally with SpeechRecognition + PocketSphinx."""
        loop = asyncio.get_running_loop()
        try:
            return await loop.run_in_executor(_EXECUTOR, self._transcribe_local_blocking, utterance)
        except Exception as exc:
            logger.error("Local STT failed: %s", exc)
            if self._bus:
                await self._bus.publish(
                    Event(type=EventType.ERROR, payload={"source": "stt", "error": str(exc)})
                )
            raise RuntimeError(f"STT transcription failed: {exc}") from exc

    def _transcribe_local_blocking(self, utterance: Utterance) -> Transcription:
        """Blocking local transcription run inside a dedicated executor thread."""
        if not utterance.pcm:
            return Transcription(text="", provider="local", raw={"note": "empty audio"})

        audio_data = sr.AudioData(
            utterance.pcm,
            sample_rate=utterance.sample_rate,
            sample_width=2,
        )

        kwargs: dict[str, str] = {}
        if self._config.language:
            kwargs["language"] = self._config.language

        try:
            text = self._recognizer.recognize_sphinx(audio_data, **kwargs).strip()
        except sr.UnknownValueError:
            text = ""
        except sr.RequestError as exc:
            raise RuntimeError(f"PocketSphinx failed: {exc}") from exc

        logger.info("Transcribed locally: %s", text[:120] + ("…" if len(text) > 120 else ""))
        return Transcription(
            text=text,
            language=self._config.language,
            confidence=None,
            provider="local",
            raw={
                "engine": self._config.model,
                "duration_ms": utterance.duration_ms,
            },
        )

    async def _transcribe_remote(self, utterance: Utterance) -> Transcription:
        """Transcribe PCM audio with a remote OpenAI-compatible Whisper endpoint."""
        if not self._config.api_key:
            return Transcription(
                text="",
                provider="stub",
                raw={
                    "note": (
                        "Local STT is disabled and no remote STT API key is configured. "
                        "Set AURA_STT_PROVIDER=local, or configure a remote Whisper API."
                    )
                },
            )

        from aura.audio.wav import pcm16_to_wav

        wav = pcm16_to_wav(
            utterance.pcm,
            sample_rate=utterance.sample_rate,
            channels=utterance.channels,
        )
        return await self._transcribe_whisper(wav)

    async def _transcribe_whisper(self, wav: bytes) -> Transcription:
        """POST a WAV blob to the OpenAI Whisper transcription endpoint."""
        session = await self._get_session()
        base = self._config.base_url or "https://api.openai.com/v1"
        headers = {"Authorization": f"Bearer {self._config.api_key}"}

        form = aiohttp.FormData()
        form.add_field(
            "file",
            wav,
            filename="utterance.wav",
            content_type="audio/wav",
        )
        form.add_field("model", self._config.model)
        form.add_field("response_format", "json")
        if self._config.language:
            form.add_field("language", self._config.language)

        try:
            async with session.post(
                f"{base}/audio/transcriptions",
                data=form,
                headers=headers,
            ) as resp:
                if resp.status >= 400:
                    body = await resp.text()
                    raise RuntimeError(f"HTTP {resp.status}: {body[:300]}")
                data = await resp.json()
        except Exception as exc:
            logger.error("STT transcription failed: %s", exc)
            if self._bus:
                await self._bus.publish(
                    Event(type=EventType.ERROR, payload={"source": "stt", "error": str(exc)})
                )
            raise RuntimeError(f"STT transcription failed: {exc}") from exc

        text = str(data.get("text", "")).strip()
        language = str(data.get("language", self._config.language or ""))
        logger.info("Transcribed: %s", text[:120] + ("…" if len(text) > 120 else ""))
        return Transcription(
            text=text,
            language=language,
            provider=self._config.provider,
            raw=data if isinstance(data, dict) else {},
        )

    async def shutdown(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()
            self._session = None
            logger.debug("STT client session closed")
