<div align="center">

# AURA

Local GGUF chat UI. Runs on **your machine**. Not a hosted product.

![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

</div>

AURA is a **hobby / student demo**: Next.js workspace + FastAPI + `llama-cpp-python`. You download a `.gguf` model, start two processes (or `./scripts/run.sh`), and chat in the browser.

It is **not** ChatGPT. Small 1–1.5B models are slow on CPU, weak at Turkish tutoring, and will hallucinate. CompE mode is a **system-prompt beta**, not a trained specialist.

---

## What you get

- Chat UI with session list (saved in **browser `localStorage`**, ~5 MB text cap — not RAM)
- **General** vs **CompE (Beta)** workspaces, separate chat histories
- Drop `.gguf` files into `models/` and pick them in the header
- Optional Docker Compose (first build compiles llama.cpp; expect a long wait)

## What you do not get

- Cloud accounts, a database, or a public URL
- Reliable homework-quality Computer Engineering answers on TinyLlama / Qwen 1.5B
- Fine-tuned weights — CompE is prompt-steering only

---

## Run (two terminals)

Needs **Python 3.10+** (3.9 may work), **Node 20+**, and at least one chat GGUF in `models/`.

**Terminal 1 — API** (repo root):

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python3 server.py           # macOS: use python3, not python
```

**Terminal 2 — UI:**

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### One command (macOS / Linux)

```bash
chmod +x scripts/run.sh
./scripts/run.sh
```

Uses `.venv/bin/python` if present, otherwise `python3`. Ctrl+C stops API and UI.

### Docker

```bash
docker compose up --build
```

Put GGUF files in `models/` first (gitignores `*.gguf`). CPU-only; not tuned for Apple GPU.

Starter model (small, CPU-friendly): see `models/README.md`.

---

## Layout

```text
AURA/
├── aura/           Python package (llama.cpp wrapper)
├── models/         your *.gguf files (not in git)
├── frontend/       Next.js app
├── server.py       FastAPI :8000
├── scripts/run.sh  start API + UI
└── docker-compose.yml
```

Chats live in the browser. The GGUF uses **RAM/CPU** when loaded — that is separate from the 5 MB chat-cache meter.

---

## Tested

- macOS (Intel / Apple Silicon)
- Windows 11 (Python 3.12)

MIT licensed. Issues and PRs welcome; treat this as an early local demo, not a production assistant.
