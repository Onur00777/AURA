"""Abstract LLM provider interface."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class LLMResponse:
    """Normalized response from any LLM provider."""

    content: str
    model: str
    usage: dict[str, int] = field(default_factory=dict)
    raw: dict[str, Any] = field(default_factory=dict)

    @property
    def token_count(self) -> int:
        """Total tokens consumed (prompt + completion)."""
        return self.usage.get("total_tokens", 0)


class LLMProvider(ABC):
    """Contract every LLM backend must implement."""

    @abstractmethod
    async def health_check(self) -> bool:
        """Return True when the provider is reachable and configured."""

    @abstractmethod
    async def complete(
        self,
        prompt: str,
        *,
        system: str = "",
        history: list[dict[str, str]] | None = None,
    ) -> LLMResponse:
        """Send *prompt* and return the model's reply.

        Args:
            prompt: User message.
            system: Optional system instruction.
            history: Prior chat turns (role/content), excluding *prompt*.

        Raises:
            RuntimeError: On provider failure.
        """

    @abstractmethod
    async def shutdown(self) -> None:
        """Release network resources."""
