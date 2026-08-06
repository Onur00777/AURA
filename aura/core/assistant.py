"""Main AURA assistant orchestrator (terminal chat mode)."""

from __future__ import annotations

import asyncio
import logging
import signal
from typing import Final

from aura.config import AuraConfig, load_config
from aura.core.conversation import ConversationLoop
from aura.core.events import Event, EventBus, EventType
from aura.core.lifecycle import BootSequence
from aura.llm.client import LLMClient
from aura.tools.registry import ToolRegistry
from aura.utils.logging import setup_logging
from aura.utils.terminal import TerminalDisplay

logger = logging.getLogger(__name__)

_SHUTDOWN_TIMEOUT: Final[float] = 5.0


class AuraAssistant:
    """Top-level coordinator for the AURA terminal chat assistant.

    Owns the event bus, LLM, tools, and lifecycle. After boot, runs a
    text prompt → LLM → print conversation loop.
    """

    def __init__(self, config: AuraConfig | None = None) -> None:
        self._config = config or load_config()
        self._bus = EventBus()
        self._llm = LLMClient(self._config.llm, event_bus=self._bus)
        self._tools = ToolRegistry(event_bus=self._bus)
        self._terminal = TerminalDisplay(use_color=self._config.boot.logo_color)
        self._shutdown_event = asyncio.Event()
        self._running = False
        self._stopped = False

    @property
    def event_bus(self) -> EventBus:
        """Expose the event bus for external module wiring."""
        return self._bus

    @property
    def tools(self) -> ToolRegistry:
        """Expose the tool registry for plugin registration."""
        return self._tools

    async def start(self) -> None:
        """Boot the assistant and enter the terminal chat loop."""
        setup_logging(self._config.log_level)
        self._register_signal_handlers()

        boot = BootSequence(
            config=self._config,
            event_bus=self._bus,
            llm=self._llm,
            tools=self._tools,
            terminal=self._terminal,
        )

        result = await boot.run()
        if not result.success:
            logger.error(
                "Boot failed (%d/%d checks, greeting=%s)",
                result.checks_passed,
                result.checks_total,
                result.greeting_spoken,
            )
            return

        if self._shutdown_event.is_set():
            return

        self._running = True
        logger.info("AURA is online — entering terminal chat loop")

        conversation = ConversationLoop(
            config=self._config,
            llm=self._llm,
            terminal=self._terminal,
            shutdown_event=self._shutdown_event,
            event_bus=self._bus,
        )
        try:
            await conversation.run()
        finally:
            await self.stop()

    async def stop(self) -> None:
        """Gracefully shut down all subsystems (idempotent)."""
        self._shutdown_event.set()
        if self._stopped:
            return
        self._stopped = True
        self._running = False

        logger.info("Shutdown requested")
        await self._bus.publish(Event(type=EventType.SHUTDOWN))

        try:
            await asyncio.wait_for(self._llm.shutdown(), timeout=_SHUTDOWN_TIMEOUT)
        except asyncio.TimeoutError:
            logger.warning("llm shutdown timed out")
        except Exception as exc:
            logger.error("Error during llm shutdown: %s", exc)

        logger.info("AURA offline")

    def _register_signal_handlers(self) -> None:
        """Register SIGINT/SIGTERM handlers when supported."""
        loop = asyncio.get_running_loop()

        for sig in (signal.SIGINT, signal.SIGTERM):
            try:
                loop.add_signal_handler(sig, lambda: asyncio.create_task(self.stop()))
            except (NotImplementedError, RuntimeError):
                # Windows ProactorEventLoop lacks add_signal_handler.
                pass
