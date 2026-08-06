"""Allow ``python -m aura`` as an alternative entry point."""

from aura.app import main

if __name__ == "__main__":
    raise SystemExit(main())
