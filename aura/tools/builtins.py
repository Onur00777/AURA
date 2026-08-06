"""Built-in demonstration tools."""

from __future__ import annotations

import platform
from typing import Any

from aura.tools.base import Tool, ToolContext, ToolResult


class EchoTool(Tool):
    """Echoes input back — useful for pipeline testing."""

    @property
    def name(self) -> str:
        return "echo"

    @property
    def description(self) -> str:
        return "Echoes the provided message back unchanged."

    def schema(self) -> dict[str, Any]:
        return {
            "type": "object",
            "properties": {"message": {"type": "string", "description": "Text to echo"}},
            "required": ["message"],
        }

    async def execute(self, params: dict[str, Any], context: ToolContext) -> ToolResult:
        message = params.get("message", "")
        return ToolResult(success=True, output=message, data={"echo": message})


class SystemInfoTool(Tool):
    """Returns basic OS / Python platform information."""

    @property
    def name(self) -> str:
        return "system_info"

    @property
    def description(self) -> str:
        return "Returns operating system and Python runtime information."

    async def execute(self, params: dict[str, Any], context: ToolContext) -> ToolResult:
        info = {
            "system": platform.system(),
            "release": platform.release(),
            "machine": platform.machine(),
            "python": platform.python_version(),
        }
        summary = f"{info['system']} {info['release']} ({info['machine']}), Python {info['python']}"
        return ToolResult(success=True, output=summary, data=info)
