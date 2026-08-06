"""Terminal presentation: ASCII art, colors, and boot-sequence rendering."""

from __future__ import annotations

import asyncio
import sys
from dataclasses import dataclass
from typing import Final, Iterable

# ANSI escape codes — work in modern macOS Terminal, iTerm2, Windows Terminal.
_RESET: Final[str] = "\033[0m"
_DIM: Final[str] = "\033[2m"
_CYAN: Final[str] = "\033[36m"
_GREEN: Final[str] = "\033[32m"
_YELLOW: Final[str] = "\033[33m"
_RED: Final[str] = "\033[31m"
_BOLD: Final[str] = "\033[1m"
_MAGENTA: Final[str] = "\033[35m"

AURA_LOGO: Final[str] = r"""
     █████╗ ██╗   ██╗██████╗  █████╗
    ██╔══██╗██║   ██║██╔══██╗██╔══██╗
    ███████║██║   ██║██████╔╝███████║
    ██╔══██║██║   ██║██╔══██╗██╔══██║
    ██║  ██║╚██████╔╝██║  ██║██║  ██║
    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
         Autonomous Universal
         Reasoning Assistant
"""


@dataclass(frozen=True)
class SystemCheck:
    """A single boot-sequence diagnostic line."""

    label: str
    success: bool = True
    detail: str = ""


class TerminalDisplay:
    """Renders stylized output to stdout with optional ANSI coloring."""

    def __init__(self, *, use_color: bool = True) -> None:
        self._color = use_color and sys.stdout.isatty()

    def _paint(self, text: str, *codes: str) -> str:
        if not self._color or not codes:
            return text
        return f"{''.join(codes)}{text}{_RESET}"

    def clear(self) -> None:
        """Clear the terminal screen."""
        print("\033[2J\033[H", end="", flush=True)

    def print_logo(self) -> None:
        """Print the AURA ASCII logo."""
        for line in AURA_LOGO.strip("\n").splitlines():
            print(self._paint(line, _CYAN, _BOLD), flush=True)

    def print_banner(self) -> None:
        """Print version and separator beneath the logo."""
        print(flush=True)
        print(self._paint("  ▸ AURA v0.1.0  │  Terminal Chat Interface", _DIM), flush=True)
        print(self._paint("  " + "─" * 52, _DIM), flush=True)
        print(flush=True)

    async def run_system_checks(
        self,
        checks: Iterable[SystemCheck],
        *,
        delay_seconds: float = 0.35,
    ) -> None:
        """Animate a sequential system-check sequence.

        Args:
            checks: Ordered diagnostics to display.
            delay_seconds: Pause between each check line.
        """
        for check in checks:
            await asyncio.sleep(delay_seconds)
            status = self._paint("OK", _GREEN, _BOLD) if check.success else self._paint("FAIL", _RED, _BOLD)
            detail = f"  {self._paint(check.detail, _DIM)}" if check.detail else ""
            print(f"  {self._paint('▸', _CYAN)} {check.label:<36} [{status}]{detail}", flush=True)

    def print_ready(self) -> None:
        """Print the boot-complete footer."""
        print(flush=True)
        print(self._paint("  ═══════════════════════════════════════════════════", _MAGENTA), flush=True)
        print(self._paint("   SYSTEM ONLINE — All subsystems nominal.", _GREEN, _BOLD), flush=True)
        print(self._paint("  ═══════════════════════════════════════════════════", _MAGENTA), flush=True)
        print(flush=True)

    def print_idle_prompt(self) -> None:
        """Print the post-boot idle-state hint."""
        self.print_chat_ready()

    def print_chat_ready(self) -> None:
        """Indicate that the text chat loop is ready."""
        print(
            self._paint("  Type a message and press Enter  (exit / quit / Ctrl+C to leave)", _CYAN),
            flush=True,
        )
        print(flush=True)

    def print_listening(self) -> None:
        """Compatibility alias — chat mode uses ``print_chat_ready``."""
        self.print_chat_ready()

    def user_prompt(self) -> str:
        """Return the colored prompt string for ``input()``."""
        return f"  {self._paint('You ›', _YELLOW, _BOLD)} "

    def print_user(self, text: str) -> None:
        """Print a user message (used when echoing is needed)."""
        print(f"  {self._paint('You ›', _YELLOW, _BOLD)} {text}", flush=True)

    def print_assistant(self, text: str) -> None:
        """Print AURA's reply to the terminal."""
        print(f"  {self._paint('AURA ›', _GREEN, _BOLD)} {text}", flush=True)
        print(flush=True)

    def print_status(self, message: str, *, kind: str = "dim") -> None:
        """Print a transient status line (thinking, errors, greetings)."""
        styles = {
            "dim": (_DIM,),
            "warn": (_YELLOW,),
            "error": (_RED, _BOLD),
            "ok": (_GREEN,),
        }
        codes = styles.get(kind, (_DIM,))
        print(f"  {self._paint('… ' + message, *codes)}", flush=True)
