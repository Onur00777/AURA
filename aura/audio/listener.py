"""High-level speech listener: mic stream + VAD → complete utterances."""

from __future__ import annotations

import logging

from aura.audio.capture import AudioCapture
from aura.audio.vad import EnergyVAD, Utterance
from aura.config import AudioConfig
from aura.core.events import Event, EventBus, EventType

logger = logging.getLogger(__name__)


class SpeechListener:
    """Listens on the microphone until one utterance is segmented by VAD."""

    def __init__(
        self,
        config: AudioConfig,
        capture: AudioCapture | None = None,
        event_bus: EventBus | None = None,
    ) -> None:
        self._config = config
        self._capture = capture or AudioCapture(config)
        self._vad = EnergyVAD(config)
        self._bus = event_bus
        self._owns_capture = capture is None

    @property
    def capture(self) -> AudioCapture:
        return self._capture

    async def start(self) -> None:
        """Open the microphone if we own it (or if shared capture is idle)."""
        if not self._capture.active:
            await self._capture.start()

    async def stop(self) -> None:
        """Stop capture when this listener owns the device."""
        if self._owns_capture:
            await self._capture.stop()

    async def listen_utterance(self) -> Utterance:
        """Block until VAD detects a complete spoken utterance.

        Returns:
            ``Utterance`` containing raw PCM and timing metadata.

        Raises:
            RuntimeError: If capture is unavailable or shut down mid-listen.
        """
        await self.start()
        self._vad.reset()
        self._capture.resume()

        logger.debug("Listening for speech…")
        async for chunk in self._capture.stream():
            utterance = self._vad.process(chunk)
            if utterance is None:
                continue

            logger.info(
                "Speech detected (%.0f ms, %d bytes)",
                utterance.duration_ms,
                len(utterance.pcm),
            )
            if self._bus:
                await self._bus.publish(
                    Event(
                        type=EventType.SPEECH_DETECTED,
                        payload={
                            "duration_ms": utterance.duration_ms,
                            "bytes": len(utterance.pcm),
                        },
                    )
                )
            return utterance

        raise RuntimeError("Microphone stream ended before an utterance was captured")
