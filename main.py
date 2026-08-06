#!/usr/bin/env python3
"""AURA entry point — run the cinematic boot sequence immediately.

Usage:
    python main.py
    python -m aura
"""

from __future__ import annotations

import sys

from aura.app import main

if __name__ == "__main__":
    sys.exit(main())
