"""Shared application runner."""

from __future__ import annotations

import asyncio
import logging

from aura.config import load_config
from aura.core.assistant import AuraAssistant

logger = logging.getLogger(__name__)


async def run_assistant() -> None:
    """Create, start, and gracefully stop the AURA assistant."""
    assistant = AuraAssistant(load_config())
    try:
        await assistant.start()
    finally:
        await assistant.stop()


def main() -> int:
    """Synchronous entry point."""
    try:
        asyncio.run(run_assistant())
    except KeyboardInterrupt:
        print("\n  Interrupted — shutting down.")
    return 0
