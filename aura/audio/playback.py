"""Audio playback stub for future TTS buffer / chime output."""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


class AudioPlayback:
    """Async audio output (placeholder)."""

    def __init__(self, sample_rate: int = 16_000) -> None:
        self.sample_rate = sample_rate

    async def play(self, data: bytes) -> None:
        """Play raw PCM *data* (not yet implemented)."""
        logger.debug("AudioPlayback.play called with %d bytes (stub)", len(data))

    async def health_check(self) -> bool:
        """Return True when playback backend is available."""
        return True
