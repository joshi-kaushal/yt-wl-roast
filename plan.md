# Plan: Move LLM logic into a Python + FastAPI backend

## Goal
Stop shipping the LLM key in the browser. The extension keeps scraping YouTube titles client-side (it needs the DOM + `chrome.*` APIs), then POSTs them to a Dockerized FastAPI backend that calls **OpenRouter** (`gemma-2-9b-it:free` by default, env-overridable), protected by a shared-secret header + per-IP rate limiting.

## Architecture
```
Chrome extension (popup)
  │  scrape titles (content script, stays client-side)
  ▼
POST http://localhost:8000/api/roast
  headers: X-Shared-Secret, Content-Type: application/json
  body:   { "titles": ["...", "..."] }
  │
  ▼
FastAPI backend  ──(shared secret check)──► (per-IP rate limit)──► OpenRouter (gemma-2-9b-free)
  ▲                                                                       │
  └────────────────── { "roast": "..." } ◄───────────────────────────────┘
```

## Backend (`backend/`, new folder in same repo)
- **`backend/requirements.txt`**: `fastapi`, `uvicorn[standard]`, `openai` (OpenRouter is OpenAI-compatible), `pydantic-settings`, `slowapi`, `python-dotenv`.
- **`backend/.env.example`** → copied to `backend/.env` (gitignored):
  - `OPENROUTER_API_KEY=` (you'll add yours)
  - `SHARED_SECRET=` (any string; extension sends it)
  - `MODEL=google/gemma-2-9b-it:free`
  - `RATE_LIMIT_PER_MINUTE=20`
  - `HOST=0.0.0.0`, `PORT=8000`
- **`backend/app/config.py`** — `pydantic-settings` loads the above from `.env`.
- **`backend/app/auth.py`** — `verify_secret` dependency: reads `X-Shared-Secret` header, constant-time-compares to `SHARED_SECRET`; returns `401` if missing/wrong.
- **`backend/app/openrouter.py`** — wraps the `openai` client with `base_url="https://openrouter.ai/api/v1"`; exposes `roast(titles: list[str]) -> str`. Optional OpenRouter headers (`HTTP-Referer`, `X-Title`).
- **`backend/app/prompts.py`** — the existing brutal-roast system prompt; titles passed as JSON in the user message.
- **`backend/app/main.py`**:
  - CORS `allow_origins=["*"]`, `allow_methods=["*"]`, `allow_headers=["*"]` (extension origin is `chrome-extension://<id>`; secret is the real gate).
  - `slowapi` `Limiter(key_func=get_remote_address)` → `@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")` on the route; returns `429`.
  - `GET /` health check.
  - `POST /api/roast`:
    - Pydantic body `{ titles: list[str] }`, validated non-empty + max count/length.
    - Calls `verify_secret` → rate limit → `openrouter.roast()` → `{ "roast": text }`.
    - `422` bad input, `502` upstream failure, `401`/`429` as above.
- **`backend/Dockerfile`** — `python:3.12-slim`, install reqs, `CMD uvicorn app.main:app --host 0.0.0.0 --port 8000`.
- **`backend/docker-compose.yml`** — maps `8000:8000`, `env_file: .env`.
- **`backend/.dockerignore`** + **`backend/README.md`** (run instructions: `docker compose up --build` or `uvicorn`).

## Extension changes
- **`src/lib/config.ts`** (new): hardcode `BACKEND_URL = "http://localhost:8000/api/roast"` and `SHARED_SECRET = "..."` (your chosen secret).
- **`src/lib/gemini.ts`** → rewrite `executeAI` to `fetch(BACKEND_URL, { method:"POST", headers:{ "Content-Type":"application/json", "X-Shared-Secret": SHARED_SECRET }, body: JSON.stringify({ titles: JSON.parse(data) }) })` and return `res.roast`. Keep current error/loading UX.
- **`src/lib/storage.ts`** → delete `getGeminiAPIKey` and the **hardcoded default key** (the leak). Keep generic `setItem`/`getItem` if still needed, else trim.
- **`src/lib/appwrite.js`** → **delete** (dead code + second hardcoded key).
- **`public/manifest.json`** → add `"host_permissions": ["http://localhost/*", "http://127.0.0.1/*"]` (swap for your deployed domain later).
- **`package.json`** → remove `@google/generative-ai` dependency.
- **Root `.gitignore`** → add `backend/.env`.
- **`README.md`** → document backend setup + that the key is now server-side.

## Security notes
- OpenRouter key lives only in `backend/.env` (server-side). Never committed.
- The extension's `SHARED_SECRET` is visible to anyone inspecting the unpacked extension — it's **obfuscation only**, not real security. It deters casual abuse; the per-IP rate limit is the real cost guard.
- **Per-IP caveat**: locally every request comes from `127.0.0.1`, so the per-IP limit effectively acts as a global cap on your machine. If you later deploy for multiple users, switch to per-secret limiting.

## Implementation order
1. Scaffold `backend/` (requirements, `.env.example`, config, auth, openrouter, prompts, main).
2. Add `Dockerfile` + `docker-compose.yml` + `.dockerignore`.
3. Extension: `config.ts`, rewrite `gemini.ts`, trim `storage.ts`, delete `appwrite.js`, update `manifest.json`, drop `@google/generative-ai`, update `.gitignore` + README.
4. Verify (below).

## Verification
- Backend: `docker compose up --build`, then
  - `curl -X POST localhost:8000/api/roast -H "X-Shared-Secret: <secret>" -H "Content-Type: application/json" -d '{"titles":["How to wake up at 5am","15 min abs"]}'` → expect `{ "roast": "..." }`.
  - No secret → `401`; hammer >20/min → `429`; bad body → `422`.
- Extension: `pnpm build`, load unpacked `dist/`, open `youtube.com/playlist?list=WL`, click **Roast** → confirm request hits backend and roast renders.

## Out of scope (say if you want it)
DB/history, user accounts, rotating models per request, deploy config (Render/Railway), or a settings UI in the popup.
