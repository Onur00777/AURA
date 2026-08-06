"""PCM ↔ WAV helpers used by the STT pipeline."""

from __future__ import annotations

import io
import wave


def pcm16_to_wav(pcm: bytes, *, sample_rate: int, channels: int = 1) -> bytes:
    """Wrap raw 16-bit little-endian PCM in a WAV container.

    Args:
        pcm: Interleaved int16 PCM samples.
        sample_rate: Sample rate in Hz.
        channels: Number of channels (mono = 1).

    Returns:
        Complete WAV file bytes suitable for Whisper / STT APIs.
    """
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm)
    return buffer.getvalue()
