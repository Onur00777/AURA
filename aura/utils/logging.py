"""Structured logging setup for AURA."""

from __future__ import annotations

import logging
import sys
from typing import Final

_LOG_FORMAT: Final[str] = "%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s"
_DATE_FORMAT: Final[str] = "%H:%M:%S"


def setup_logging(level: str = "INFO") -> logging.Logger:
    """Configure root logging and return the AURA logger.

    Args:
        level: Log level name (DEBUG, INFO, WARNING, ERROR, CRITICAL).

    Returns:
        Configured logger bound to the ``aura`` namespace.
    """
    numeric_level = getattr(logging, level.upper(), logging.INFO)

    root = logging.getLogger()
    if not root.handlers:
        handler = logging.StreamHandler(sys.stderr)
        handler.setFormatter(logging.Formatter(_LOG_FORMAT, datefmt=_DATE_FORMAT))
        root.addHandler(handler)

    root.setLevel(numeric_level)

    # Suppress noisy third-party loggers during boot.
    logging.getLogger("pyttsx3").setLevel(logging.WARNING)

    logger = logging.getLogger("aura")
    logger.setLevel(numeric_level)
    return logger
