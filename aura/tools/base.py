"""Base classes for AURA tools (plugins)."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class ToolContext:
    """Runtime context passed to every tool invocation."""

    session_id: str = "default"
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ToolResult:
    """Normalized output from a tool execution."""

    success: bool
    output: str
    data: dict[str, Any] = field(default_factory=dict)
    error: str = ""


class Tool(ABC):
    """Abstract base for all AURA tools.

    Subclass this, implement ``name``, ``description``, and ``execute``,
    then register via ``ToolRegistry.register()``.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique tool identifier (e.g. ``"system_info"``)."""

    @property
    @abstractmethod
    def description(self) -> str:
        """Human-readable description for LLM tool-selection prompts."""

    @abstractmethod
    async def execute(self, params: dict[str, Any], context: ToolContext) -> ToolResult:
        """Run the tool with *params* and return a ``ToolResult``."""

    def schema(self) -> dict[str, Any]:
        """JSON-schema-like parameter definition (override for LLM function-calling)."""
        return {"type": "object", "properties": {}, "required": []}
