"""Tool registration and dispatch."""

from __future__ import annotations

import logging
from typing import Any

from aura.core.events import Event, EventBus, EventType
from aura.tools.base import Tool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class ToolRegistry:
    """Central registry for discoverable, pluggable tools.

    Example::

        registry = ToolRegistry()
        registry.register(SystemInfoTool())
        result = await registry.invoke("system_info", {})
    """

    def __init__(self, event_bus: EventBus | None = None) -> None:
        self._tools: dict[str, Tool] = {}
        self._bus = event_bus
        self._register_builtins()

    def register(self, tool: Tool) -> None:
        """Add a tool to the registry.

        Raises:
            ValueError: If a tool with the same name is already registered.
        """
        if tool.name in self._tools:
            raise ValueError(f"Tool '{tool.name}' is already registered")
        self._tools[tool.name] = tool
        logger.debug("Registered tool: %s", tool.name)

    def unregister(self, name: str) -> None:
        """Remove a tool by name."""
        self._tools.pop(name, None)

    def get(self, name: str) -> Tool | None:
        """Look up a tool by name."""
        return self._tools.get(name)

    def list_tools(self) -> list[Tool]:
        """Return all registered tools."""
        return list(self._tools.values())

    def count(self) -> int:
        """Return the number of registered tools."""
        return len(self._tools)

    def descriptions(self) -> dict[str, str]:
        """Map tool names to descriptions (for LLM system prompts)."""
        return {t.name: t.description for t in self._tools.values()}

    async def invoke(
        self,
        name: str,
        params: dict[str, Any],
        context: ToolContext | None = None,
    ) -> ToolResult:
        """Execute a registered tool by name.

        Args:
            name: Tool identifier.
            params: Arguments for the tool.
            context: Optional invocation context.

        Returns:
            ``ToolResult`` from the tool, or an error result if not found.
        """
        tool = self._tools.get(name)
        if tool is None:
            return ToolResult(success=False, output="", error=f"Unknown tool: {name}")

        ctx = context or ToolContext()

        if self._bus:
            await self._bus.publish(
                Event(type=EventType.TOOL_INVOKED, payload={"tool": name, "params": params})
            )

        try:
            result = await tool.execute(params, ctx)
            logger.info("Tool '%s' → success=%s", name, result.success)
            return result
        except Exception as exc:
            logger.error("Tool '%s' raised: %s", name, exc, exc_info=exc)
            return ToolResult(success=False, output="", error=str(exc))

    def _register_builtins(self) -> None:
        """Register built-in demo tools shipped with AURA."""
        from aura.tools.builtins import EchoTool, SystemInfoTool

        self.register(EchoTool())
        self.register(SystemInfoTool())
