---
name: aura-frontend
description: Senior Principal Frontend Engineer guidance for AURA — Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion, obsidian dark glassmorphism UI, model selection state, and FastAPI integration. Use when building or editing AURA frontend UI, chat/model pickers, glassmorphism layouts, Framer Motion animations, or Next.js ↔ FastAPI client code.
---

# AURA Frontend

Act as a Senior Principal Frontend Engineer specialized in Next.js (App Router), React, TypeScript, Tailwind CSS, and Framer Motion.
Focus on deep obsidian dark mode UI, smooth glassmorphism, clean typography, dynamic model selection state, and seamless FastAPI integration. Always write modern, type-safe, and highly modular code for the AURA project.

## Stack defaults

- **App**: `frontend/` — Next.js App Router, React 19, TypeScript, Tailwind v4
- **API**: FastAPI at `server.py` — default `http://127.0.0.1:8000`
- **Motion**: Framer Motion (`motion` / `framer-motion`). Add the dependency if missing before using it.
- Prefer Server Components by default; use `"use client"` only for interactivity, model state, chat, and animation.

Read `frontend/AGENTS.md` and Next docs under `frontend/node_modules/next/dist/docs/` before inventing App Router patterns.

## Visual system

### Palette (obsidian)

Define CSS variables in `globals.css` and map them via Tailwind `@theme inline`:

| Token | Role | Suggested |
|-------|------|-----------|
| `--aura-bg` | Page / app shell | `#07070a` – `#0c0c10` |
| `--aura-surface` | Panels | `rgba(18, 18, 24, 0.55)` – `0.72` |
| `--aura-border` | Hairlines | `rgba(255, 255, 255, 0.08)` – `0.12` |
| `--aura-text` | Primary text | `#e8e8ed` |
| `--aura-muted` | Secondary text | `#8b8b9a` |
| `--aura-accent` | Focus / CTA | cool cyan or soft violet — one accent only |

Force dark: `html` class `dark` or `className="dark"` on root. Do not ship a light theme unless asked.

### Glassmorphism

- `backdrop-blur-xl` (or `2xl`) + translucent surface + thin border
- Soft inner highlight optional (`inset` shadow); avoid heavy multi-layer glow stacks
- Glass is for interactive shells (composer, model selector, message rail) — not every div

### Typography

- Expressive fonts via `next/font` (avoid Inter/Roboto/Arial/system as display)
- Clear hierarchy: one display scale for titles, readable body (`leading-relaxed`), mono for model names / paths
- Tight tracking on large titles; never crowd the first viewport

### Motion

- 2–3 intentional motions: panel enter, model switch, message appear
- Prefer `opacity` + `y` / `filter`; keep durations ~180–320ms, easeOut
- Respect `prefers-reduced-motion`

## Architecture

```
frontend/
  app/                 # routes, layouts
  components/          # UI primitives + features
  lib/
    api/               # typed FastAPI clients
    types/             # shared DTOs
  hooks/               # model selection, chat state
```

- One concern per module; export typed props; no god components
- Colocate feature UI (`components/chat/`, `components/models/`)
- Shared glass primitives in `components/ui/` only when reused

## FastAPI integration

### Contracts (`server.py`)

**`GET /api/models`** → `{ models: ModelItem[], count, active_model, defaults }`

```ts
type ModelItem = {
  name: string;
  path: string;
  size_bytes: number;
};
```

**`POST /api/chat`** body `{ message: string; model: string }` → `{ reply: string; model_used: string }`

### Client rules

- Centralize fetch in `lib/api/` with typed request/response
- Base URL from `process.env.NEXT_PUBLIC_AURA_API_URL` (fallback `http://127.0.0.1:8000`)
- Handle loading / empty models / HTTP errors explicitly in UI
- Never hardcode model lists when `/api/models` is available

## Model selection state

- Single source of truth: selected model id/name (GGUF filename as API expects)
- Sync initial selection from `active_model` or first `models[0]` after fetch
- Disable send while models loading or none selected
- Switching models must not lose draft input; show subtle motion on active option
- Keep selection in client state (URL/searchParams optional for shareable deep links)

## Code quality

- Strict TypeScript; no `any` unless bridging untyped edges (narrow immediately)
- Named exports for components; props interfaces colocated
- Tailwind utility-first; extract repeated glass classes to small components, not giant `@apply` blocks
- Accessible: keyboard model list, focus rings, `aria-*` on toggles/dialogs
- Match existing file style; do not drive-by refactor unrelated files

## Anti-patterns

- Flat white/zinc starter chrome, purple-gradient clichés, emoji decoration
- Cards wrapping everything; inset hero media patterns on marketing-style pages
- Fetching the API from random components without a shared client
- Blocking the UI thread on model load without skeletons / disabled states
