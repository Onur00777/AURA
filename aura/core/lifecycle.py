"""Boot sequence orchestration (terminal / CLI mode)."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from aura.config import AuraConfig
from aura.core.events import Event, EventBus, EventType
from aura.llm.client import LLMClient
from aura.tools.registry import ToolRegistry
from aura.utils.terminal import SystemCheck, TerminalDisplay

logger = logging.getLogger(__name__)

_SOFT_CHECK_LABELS = frozenset(
    {
        "Initializing local LLM",
        "Connecting to LLM API",
    }
)


@dataclass(frozen=True)
class BootResult:
    """Outcome of the boot sequence."""

    success: bool
    checks_passed: int
    checks_total: int
    greeting_spoken: bool


class BootSequence:
    """Runs the cinematic terminal boot sequence (no microphone / STT)."""

    def __init__(
        self,
        config: AuraConfig,
        event_bus: EventBus,
        llm: LLMClient,
        tools: ToolRegistry,
        terminal: TerminalDisplay | None = None,
    ) -> None:
        self._config = config
        self._bus = event_bus
        self._llm = llm
        self._tools = tools
        self._terminal = terminal or TerminalDisplay(use_color=config.boot.logo_color)

    async def run(self) -> BootResult:
        """Execute the full boot sequence."""
        await self._bus.publish(Event(type=EventType.BOOT_STARTED))

        aura_logger = logging.getLogger("aura")
        previous_level = aura_logger.level
        aura_logger.setLevel(logging.WARNING)

        passed = 0
        success = False
        greeting_spoken = False
        checks: list[SystemCheck] = []

        try:
            self._terminal.clear()
            self._terminal.print_logo()
            self._terminal.print_banner()

            checks = await self._build_checks()
            await self._terminal.run_system_checks(
                checks,
                delay_seconds=self._config.boot.check_delay_seconds,
            )

            passed = sum(1 for c in checks if c.success)
            success = all(c.success for c in checks if c.label not in _SOFT_CHECK_LABELS)

            self._terminal.print_ready()
            self._terminal.print_status(self._config.boot.greeting, kind="ok")
            greeting_spoken = True

        finally:
            aura_logger.setLevel(previous_level)

        await self._bus.publish(
            Event(
                type=EventType.BOOT_COMPLETED,
                payload={"success": success, "checks_passed": passed},
            )
        )
        logger.info("Boot sequence complete (success=%s)", success)

        return BootResult(
            success=success,
            checks_passed=passed,
            checks_total=len(checks),
            greeting_spoken=greeting_spoken,
        )

    async def _build_checks(self) -> list[SystemCheck]:
        """Probe core CLI subsystems (no audio / STT)."""
        checks: list[SystemCheck] = []

        llm_ok = await self._llm.health_check()
        llm_provider = self._config.llm.provider.strip().lower()
        if llm_provider in {"local", "llama_cpp", "llama-cpp", "llamacpp", "gguf", "offline"}:
            path_hint = self._config.llm.model_path or self._config.llm.model or "models/*.gguf"
            llm_detail = f"local n_ctx={self._config.llm.n_ctx} · {path_hint}"
            llm_label = "Initializing local LLM"
        else:
            llm_detail = self._config.llm.provider if llm_ok else "offline / no key"
            llm_label = "Connecting to LLM API"
        checks.append(
            SystemCheck(
                label=llm_label,
                success=llm_ok,
                detail=llm_detail,
            )
        )

        tool_count = self._tools.count()
        checks.append(
            SystemCheck(
                label="Loading tool registry",
                success=True,
                detail=f"{tool_count} tool(s) registered",
            )
        )

        checks.append(SystemCheck(label="Initializing event bus", success=True))
        checks.append(
            SystemCheck(label="Verifying async runtime", success=True, detail="asyncio")
        )
        checks.append(SystemCheck(label="Terminal chat interface", success=True, detail="CLI"))

        import platform

        checks.append(
            SystemCheck(
                label="Detecting platform",
                success=True,
                detail=f"{platform.system()} {platform.release()}",
            )
        )

        return checks
