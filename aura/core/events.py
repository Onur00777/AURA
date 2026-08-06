"""Async event bus for decoupled inter-module communication."""

from __future__ import annotations

import asyncio
import logging
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum, auto
from typing import Any, Callable, Coroutine, DefaultDict

logger = logging.getLogger(__name__)

Handler = Callable[["Event"], Coroutine[Any, Any, None]]


class EventType(Enum):
    """Canonical event types emitted across the AURA runtime."""

    BOOT_STARTED = auto()
    BOOT_COMPLETED = auto()
    SPEECH_DETECTED = auto()
    TRANSCRIPTION_READY = auto()
    LLM_REQUEST = auto()
    LLM_RESPONSE = auto()
    TTS_STARTED = auto()
    TTS_COMPLETED = auto()
    TOOL_INVOKED = auto()
    ERROR = auto()
    SHUTDOWN = auto()


@dataclass(frozen=True)
class Event:
    """Immutable event envelope."""

    type: EventType
    payload: dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def __str__(self) -> str:
        return f"Event({self.type.name}, payload={self.payload!r})"


class EventBus:
    """Lightweight publish/subscribe bus backed by asyncio.

    Modules subscribe to ``EventType`` values and receive events without
    direct imports — this keeps the core loop extensible.
    """

    def __init__(self) -> None:
        self._subscribers: DefaultDict[EventType, list[Handler]] = defaultdict(list)
        self._lock = asyncio.Lock()

    def subscribe(self, event_type: EventType, handler: Handler) -> None:
        """Register an async handler for a given event type."""
        self._subscribers[event_type].append(handler)
        logger.debug("Subscribed %s to %s", handler.__qualname__, event_type.name)

    def unsubscribe(self, event_type: EventType, handler: Handler) -> None:
        """Remove a previously registered handler."""
        try:
            self._subscribers[event_type].remove(handler)
        except ValueError:
            logger.warning("Handler %s was not subscribed to %s", handler.__qualname__, event_type.name)

    async def publish(self, event: Event) -> None:
        """Dispatch an event to all subscribers concurrently."""
        handlers = self._subscribers.get(event.type, [])
        if not handlers:
            logger.debug("No subscribers for %s", event.type.name)
            return

        logger.debug("Publishing %s to %d handler(s)", event, len(handlers))
        results = await asyncio.gather(
            *(handler(event) for handler in handlers),
            return_exceptions=True,
        )
        for result in results:
            if isinstance(result, Exception):
                logger.error("Event handler raised: %s", result, exc_info=result)
