"""Energy-based Voice Activity Detection (VAD).

Lightweight and dependency-free beyond NumPy — good enough to segment
utterances for STT without pulling in webrtcvad / torch.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from enum import Enum, auto

import numpy as np

from aura.config import AudioConfig


class VADState(Enum):
    """Finite-state machine for utterance segmentation."""

    SILENCE = auto()
    SPEECH = auto()


@dataclass(frozen=True)
class Utterance:
    """A complete speech segment ready for transcription."""

    pcm: bytes
    sample_rate: int
    channels: int
    duration_ms: float


class EnergyVAD:
    """RMS energy VAD with pre-roll and trailing-silence end detection.

    State machine:
        SILENCE → (energy > threshold) → SPEECH
        SPEECH  → (silence held for ``silence_duration_ms``) → emit utterance
    """

    def __init__(self, config: AudioConfig) -> None:
        self._config = config
        self._state = VADState.SILENCE
        self._speech_chunks: list[bytes] = []
        self._silence_ms = 0.0
        self._speech_ms = 0.0

        chunk_ms = (config.chunk_size / config.sample_rate) * 1000.0
        self._chunk_ms = chunk_ms
        pre_chunks = max(1, int(config.pre_speech_ms / chunk_ms))
        self._pre_roll: deque[bytes] = deque(maxlen=pre_chunks)

    @property
    def state(self) -> VADState:
        return self._state

    def reset(self) -> None:
        """Clear buffers and return to silence."""
        self._state = VADState.SILENCE
        self._speech_chunks.clear()
        self._silence_ms = 0.0
        self._speech_ms = 0.0
        self._pre_roll.clear()

    def process(self, pcm_chunk: bytes) -> Utterance | None:
        """Feed one PCM chunk; return an ``Utterance`` when speech ends.

        Args:
            pcm_chunk: Raw int16 PCM for one audio frame.

        Returns:
            Completed utterance, or ``None`` if still listening.
        """
        energy = self._rms(pcm_chunk)
        is_speech = energy >= self._config.vad_threshold

        if self._state is VADState.SILENCE:
            self._pre_roll.append(pcm_chunk)
            if is_speech:
                self._state = VADState.SPEECH
                self._speech_chunks = list(self._pre_roll)
                self._speech_ms = len(self._speech_chunks) * self._chunk_ms
                self._silence_ms = 0.0
            return None

        # SPEECH state
        self._speech_chunks.append(pcm_chunk)
        self._speech_ms += self._chunk_ms

        if is_speech:
            self._silence_ms = 0.0
        else:
            self._silence_ms += self._chunk_ms

        ended_by_silence = self._silence_ms >= self._config.silence_duration_ms
        ended_by_max = self._speech_ms >= self._config.max_utterance_ms

        if not (ended_by_silence or ended_by_max):
            return None

        if self._speech_ms < self._config.min_speech_ms:
            self.reset()
            return None

        pcm = b"".join(self._speech_chunks)
        utterance = Utterance(
            pcm=pcm,
            sample_rate=self._config.sample_rate,
            channels=self._config.channels,
            duration_ms=self._speech_ms,
        )
        self.reset()
        return utterance

    @staticmethod
    def _rms(pcm_chunk: bytes) -> float:
        """Compute normalized RMS energy for an int16 PCM chunk."""
        if not pcm_chunk:
            return 0.0
        samples = np.frombuffer(pcm_chunk, dtype=np.int16).astype(np.float32)
        if samples.size == 0:
            return 0.0
        return float(np.sqrt(np.mean(np.square(samples / 32768.0))))
