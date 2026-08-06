"""Abstract STT provider interface."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

from aura.audio.vad import Utterance


@dataclass(frozen=True)
class Transcription:
    """Normalized STT result."""

    text: str
    language: str = ""
    confidence: float | None = None
    provider: str = ""
    raw: dict[str, Any] = field(default_factory=dict)

    @property
    def is_empty(self) -> bool:
        return not self.text.strip()


class STTProvider(ABC):
    """Contract every speech-to-text backend must implement."""

    @abstractmethod
    async def health_check(self) -> bool:
        """Return True when the provider is configured / reachable."""

    @abstractmethod
    async def transcribe(self, utterance: Utterance) -> Transcription:
        """Convert a spoken utterance into text."""

    @abstractmethod
    async def shutdown(self) -> None:
        """Release network / model resources."""
