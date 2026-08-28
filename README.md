# YouTube Watch Later Roast

We all come across random videos that we find interesting and add them in the watch later, never to actually watch them. This is a fun project that roasts you based on your YouTube's watch later playlist.

It uses an LLM (via OpenRouter) to generate the roast. **The API key now lives only on the backend** — the browser extension never sees it.

## Architecture
- **Extension (this repo, `src/`)**: scrapes your Watch Later video titles in the browser and POSTs them to the backend.
- **Backend (`backend/`, FastAPI)**: calls OpenRouter, protected by a shared `X-API-Key` header and a per-IP rate limit.

## Tech stack
- Extension: TypeScript, React (Vite), Tailwind CSS, Chrome MV3
- Backend: Python, FastAPI, OpenRouter (`google/gemma-2-9b-it:free` by default)

## Setup

### 1. Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1        # Windows
pip install -r requirements.txt
cp .env.example .env              # then fill OPENROUTER_API_KEY and YT_WL_API_KEY
uvicorn app.main:app --reload
```
The backend runs at `http://localhost:8000` and exposes `POST /roast`.

### 2. Extension
```bash
pnpm install
pnpm build
```
- Open Chrome → Extensions → "Load unpacked" → select the `dist/` folder.
- The extension points at `http://localhost:8000/roast` (see `src/lib/config.ts`). Change `BACKEND_URL` if you deploy the backend elsewhere.

## Notes
- The extension's `SHARED_SECRET` (`src/lib/config.ts`) is the same value as the backend's `YT_WL_API_KEY`. It ships in the client, so treat it as obfuscation only — the real protection is the rate limit plus keeping your OpenRouter key server-side.
- No playlist data is persisted; the backend only forwards titles to the LLM and returns the roast.
