#!/usr/bin/env python3
"""Start the AURA API and the Next.js UI in one terminal.

Usage (from the project root):

    python run.py

Ctrl+C stops both processes.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "frontend"


def _npm() -> str:
    if sys.platform == "win32":
        found = shutil.which("npm.cmd") or shutil.which("npm")
    else:
        found = shutil.which("npm")
    if not found:
        print("npm bulunamadı. Node.js kurulu olduğundan emin ol.", file=sys.stderr)
        raise SystemExit(1)
    return found


def _popen(args: list[str], cwd: Path) -> subprocess.Popen[bytes]:
    return subprocess.Popen(args, cwd=cwd)


def _stop(proc: subprocess.Popen[bytes]) -> None:
    if proc.poll() is not None:
        return
    if sys.platform == "win32":
        subprocess.run(
            ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()


def _ensure_frontend_deps(npm: str) -> None:
    if (FRONTEND / "node_modules" / "next").exists():
        return
    print("Frontend bağımlılıkları kuruluyor (npm install)…")
    install = subprocess.run([npm, "install"], cwd=FRONTEND)
    if install.returncode != 0:
        raise SystemExit(install.returncode)


def main() -> int:
    npm = _npm()
    _ensure_frontend_deps(npm)

    print("AURA", flush=True)
    print("  API  http://127.0.0.1:8000", flush=True)
    print("  UI   http://localhost:3000", flush=True)
    print("  Durdurmak için Ctrl+C", flush=True)
    print(flush=True)

    backend = _popen([sys.executable, "server.py"], ROOT)
    frontend = _popen([npm, "run", "dev"], FRONTEND)
    children = (backend, frontend)

    try:
        while True:
            for proc in children:
                code = proc.poll()
                if code is not None:
                    return code
            time.sleep(0.4)
    except KeyboardInterrupt:
        return 0
    finally:
        for proc in children:
            _stop(proc)


if __name__ == "__main__":
    raise SystemExit(main())
