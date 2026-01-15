
# AgenticAI Backend (FastAPI)

## Run locally
```bash
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

## Run unit tests
```bash
pytest -q
```

## Notes
- Gemini extraction is optional. Set GEMINI_API_KEY in backend/.env to enable it.
- Without a key, the backend uses a deterministic fallback extractor (useful for tests and demos).
