# YouTube Watch Later Roast

We all come across random videos that we find interesting and add them in the watch later, never to actually watch them. This is a fun project that roasts you based on your YouTube's watch later playlist.

It uses an LLM (via OpenRouter) to generate the roast. **The API key now lives only on the backend** — the browser extension never sees it.

## Architecture
- **Extension (`extension/`, this repo)**: scrapes your Watch Later video titles in the browser and POSTs them to the backend.
- **Backend (`backend/`, FastAPI)**: calls OpenRouter, protected by a shared `X-API-Key` header and a per-IP rate limit.

## Tech stack
- Extension: TypeScript, Vanilla (Vite), Tailwind CSS, Chrome MV3
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
cd extension
pnpm install
pnpm build
```
- Open Chrome → Extensions → "Load unpacked" → select the `extension/dist/` folder.
- Configuration comes from `extension/.env` (copy `extension/.env.example`). `VITE_BACKEND_URL` sets where the backend lives; `VITE_SHARED_SECRET` must match the backend's `YT_WL_API_KEY`. Rebuild after changing.

## Notes
- The extension's `VITE_SHARED_SECRET` (`extension/.env`) is the same value as the backend's `YT_WL_API_KEY`. It ships in the client, so treat it as obfuscation only — the real protection is the rate limit plus keeping your OpenRouter key server-side.
- The roast is returned as Markdown and rendered with `marked` + sanitized with `DOMPurify` before being shown in the popup.
- No playlist data is persisted; the backend only forwards titles to the LLM and returns the roast.

## Deploy (Railway)
The backend is containerized and deploys as a Docker service.
1. Push this repo to GitHub (the `railway.json` points Railway at `backend/Dockerfile`).
2. In Railway, create a new project → "Deploy from GitHub repo" → select this repo.
3. Railway auto-detects `railway.json` and builds the image. It sets `PORT` for you.
4. In the Railway service **Variables**, add:
   - `OPENROUTER_API_KEY` — your OpenRouter key
   - `YT_WL_API_KEY` — any secret string (must match the extension's `VITE_SHARED_SECRET` in `extension/.env`)
   - Optionally `MODEL`, `RATE_LIMIT_PER_MINUTE`, `CORS_ORIGINS`.
5. Once deployed, copy the generated `*.up.railway.app` URL.

### Point the extension at the deployed backend
- In `extension/.env`, set `VITE_BACKEND_URL` to `https://<your-app>.up.railway.app/roast` and `VITE_SHARED_SECRET` to match the backend's `YT_WL_API_KEY`.
- In `extension/public/manifest.json`, add your backend origin to `host_permissions` (e.g. `"https://<your-app>.up.railway.app/*"`).
- `pnpm build` and reload the unpacked extension.
