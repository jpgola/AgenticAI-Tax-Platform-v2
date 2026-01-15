
# AgenticAI Tax Demo

This repo contains:
- `backend/` FastAPI API (upload + preview) with unit tests
- `frontend/` Vite/React SPA that proxies `/api` to the backend in dev

## What is "unit tested" and "user tested" here?
- Unit tests: `backend/tests/test_api.py` exercises `/health`, `/api/upload`, and `/api/returns/{year}/preview`.
- User-tested: includes a simple manual QA checklist in this README (see below). Automated browser E2E tests can be added with Playwright when desired.

## Local run
### Backend
```bash
cd backend
python -m venv .venv
# Windows:
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Run unit tests
```bash
cd backend
pytest -q
```

## Manual user test checklist (5 minutes)
1. Start backend and frontend.
2. Upload a text file named `w2_2024.txt` containing lines like:
   `W2 2024`, `Wages 92000`, `Federal income tax withheld 14500`
3. Confirm the UI shows upload JSON + preview JSON.
4. Confirm backend returns 200 for `/health` and `/api/returns/2024/preview`.

## Cloudflare deployment (recommended approach)
**Frontend**: Deploy to Cloudflare Pages.
**Backend**: Deploy to Cloudflare Workers (Python) OR another host and call it from the frontend.

Cloudflare supports React+Vite workflows and also supports FastAPI package in Python Workers. citeturn0search3turn0search1

### Option A: Same-origin (best) – Pages + Workers
- Deploy frontend as Pages (static build).
- Deploy backend as a Python Worker and expose it under the same domain as `/api/*` to avoid CORS.

Cloudflare provides guidance on setting/adding CORS headers via Workers/snippets/transform rules if needed. citeturn0search2turn0search5

### Notes on env vars
If you use Vite public env vars, keep the `VITE_` prefix. (Common Vite convention; Cloudflare examples cover Vite integrations.) citeturn0search3turn0search12
