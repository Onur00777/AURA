"""Text-based terminal conversation loop: prompt → LLM → print."""

from __future__ import annotations

import asyncio
import logging
from typing import Final

from aura.config import AuraConfig
from aura.core.events import EventBus
from aura.llm.client import LLMClient
from aura.utils.terminal import TerminalDisplay

logger = logging.getLogger(__name__)

_SYSTEM_FALLBACK: Final[str] = (
    "You are AURA. Keep replies clear and concise for a terminal chat."
)


class ConversationLoop:
    """Interactive CLI chat loop.

    Pipeline per turn:
        1. Read a line from the terminal (``You › ``)
        2. Send text to the local/remote LLM
        3. Print the reply (``AURA › ``)
    """

    def __init__(
        self,
        config: AuraConfig,
        llm: LLMClient,
        terminal: TerminalDisplay,
        shutdown_event: asyncio.Event,
        event_bus: EventBus | None = None,
    ) -> None:
        self._config = config
        self._llm = llm
        self._terminal = terminal
        self._shutdown = shutdown_event
        self._bus = event_bus
        self._history: list[dict[str, str]] = []

    async def run(self) -> None:
        """Run turns until shutdown is signalled."""
        self._terminal.print_chat_ready()

        while not self._shutdown.is_set():
            try:
                await self._one_turn()
            except asyncio.CancelledError:
                raise
            except EOFError:
                self._terminal.print_status("End of input — shutting down.", kind="dim")
                self._shutdown.set()
                return
            except Exception as exc:
                logger.error("Conversation turn failed: %s", exc, exc_info=exc)
                self._terminal.print_status(f"Turn error: {exc}", kind="error")
                try:
                    await asyncio.wait_for(self._shutdown.wait(), timeout=0.5)
                except asyncio.TimeoutError:
                    pass

    async def _one_turn(self) -> None:
        """Read one user line, query the LLM, print the reply."""
        try:
            user_text = await self._read_user_line()
        except EOFError:
            raise

        if self._shutdown.is_set():
            return

        user_text = user_text.strip()
        if not user_text:
            return

        if self._is_exit_phrase(user_text):
            self._terminal.print_status("Goodbye.", kind="dim")
            self._shutdown.set()
            return

        self._terminal.print_status("Thinking…", kind="dim")
        history_window = self._history[-12:]
        try:
            reply = await self._llm.complete(
                user_text,
                system=self._config.llm.system_prompt or _SYSTEM_FALLBACK,
                history=history_window,
            )
        except Exception as exc:
            self._terminal.print_status(f"LLM failed: {exc}", kind="error")
            return

        answer = reply.content.strip()
        if not answer:
            answer = "I did not produce a useful response."

        self._terminal.print_assistant(answer)
        self._history.append({"role": "user", "content": user_text})
        self._history.append({"role": "assistant", "content": answer})

    async def _read_user_line(self) -> str:
        """Read a line from stdin without blocking the event loop."""
        prompt = self._terminal.user_prompt()
        # Race input against shutdown so Ctrl+C / stop() can unwind cleanly.
        input_task = asyncio.create_task(asyncio.to_thread(input, prompt))
        shutdown_task = asyncio.create_task(self._shutdown.wait())
        done, pending = await asyncio.wait(
            {input_task, shutdown_task},
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

        if shutdown_task in done and input_task not in done:
            return ""

        return input_task.result()

    @staticmethod
    def _is_exit_phrase(text: str) -> bool:
        normalized = text.lower().strip().rstrip(".!")
        return normalized in {
            "goodbye",
            "good bye",
            "exit",
            "quit",
            "q",
            "bye",
            "shut down",
            "shutdown",
            "aura quit",
            "aura exit",
        }
