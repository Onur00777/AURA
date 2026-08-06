"""Async microphone capture via sounddevice."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator
from typing import Any

import numpy as np
import sounddevice as sd

from aura.config import AudioConfig

logger = logging.getLogger(__name__)


class AudioCapture:
    """Non-blocking microphone input that streams int16 PCM chunks.

    sounddevice callbacks run on a PortAudio thread.  We bridge them into
    asyncio with a bounded ``Queue`` so the event loop never blocks on I/O.
    """

    def __init__(self, config: AudioConfig) -> None:
        self._config = config
        self._queue: asyncio.Queue[bytes | None] | None = None
        self._stream: sd.InputStream | None = None
        self._active = False
        self._loop: asyncio.AbstractEventLoop | None = None
        self._paused = False

    @property
    def active(self) -> bool:
        return self._active

    @property
    def paused(self) -> bool:
        return self._paused

    async def health_check(self) -> bool:
        """Verify a default (or configured) input device is available."""
        try:
            device = self._resolve_device()
            info = sd.query_devices(device, "input")
            logger.debug("Input device: %s", info["name"])
            return True
        except Exception as exc:
            logger.warning("Microphone health check failed: %s", exc)
            return False

    async def start(self) -> None:
        """Open the microphone stream and begin enqueueing PCM chunks."""
        if self._active:
            return

        self._loop = asyncio.get_running_loop()
        self._queue = asyncio.Queue(maxsize=64)
        self._paused = False

        device = self._resolve_device()

        def _callback(indata: np.ndarray, frames: int, time_info: Any, status: sd.CallbackFlags) -> None:
            if status:
                logger.debug("AudioCapture status: %s", status)
            if self._paused or self._queue is None or self._loop is None:
                return
            # Convert float32 [-1, 1] → int16 PCM bytes.
            pcm = (indata[:, 0] * 32767.0).astype(np.int16).tobytes()
            try:
                self._loop.call_soon_threadsafe(self._enqueue_drop_oldest, pcm)
            except RuntimeError:
                # Loop closed during shutdown.
                pass

        self._stream = sd.InputStream(
            samplerate=self._config.sample_rate,
            channels=self._config.channels,
            dtype="float32",
            blocksize=self._config.chunk_size,
            device=device,
            callback=_callback,
        )
        self._stream.start()
        self._active = True
        logger.info(
            "AudioCapture started (device=%s, %d Hz, chunk=%d)",
            device if device is not None else "default",
            self._config.sample_rate,
            self._config.chunk_size,
        )

    def pause(self) -> None:
        """Stop feeding chunks (used while TTS is speaking to avoid feedback)."""
        self._paused = True
        if self._queue is not None:
            self._drain_queue()

    def resume(self) -> None:
        """Resume feeding chunks after TTS completes."""
        if self._queue is not None:
            self._drain_queue()
        self._paused = False

    async def stop(self) -> None:
        """Close the stream and unblock any waiting consumers."""
        self._active = False
        self._paused = False

        if self._stream is not None:
            try:
                self._stream.stop()
                self._stream.close()
            except Exception as exc:
                logger.warning("Error closing InputStream: %s", exc)
            self._stream = None

        if self._queue is not None:
            # Sentinel wakes stream() consumers.
            await self._queue.put(None)

        logger.info("AudioCapture stopped")

    async def stream(self) -> AsyncIterator[bytes]:
        """Yield int16 PCM chunks until stopped.

        Raises:
            RuntimeError: If ``start()`` has not been called.
        """
        if not self._active or self._queue is None:
            raise RuntimeError("AudioCapture is not active — call start() first")

        while self._active:
            chunk = await self._queue.get()
            if chunk is None:
                break
            yield chunk

    def _enqueue_drop_oldest(self, pcm: bytes) -> None:
        """Push a chunk; drop oldest if the queue is full (keeps latency low)."""
        assert self._queue is not None
        if self._queue.full():
            try:
                self._queue.get_nowait()
            except asyncio.QueueEmpty:
                pass
        try:
            self._queue.put_nowait(pcm)
        except asyncio.QueueFull:
            pass

    def _drain_queue(self) -> None:
        assert self._queue is not None
        while not self._queue.empty():
            try:
                self._queue.get_nowait()
            except asyncio.QueueEmpty:
                break

    def _resolve_device(self) -> int | str | None:
        """Return a sounddevice device index/name, or None for system default."""
        configured = self._config.input_device
        if configured is None:
            return None
        # Allow numeric index via env (e.g. AURA_INPUT_DEVICE=1).
        if configured.isdigit():
            return int(configured)
        return configured
