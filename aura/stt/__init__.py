"""Speech-to-text integration layer."""

from aura.stt.base import STTProvider, Transcription
from aura.stt.client import STTClient

__all__ = ["STTClient", "STTProvider", "Transcription"]
