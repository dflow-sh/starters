# Python FastAPI starter

Minimal API with a JSON `GET /health` route for dFlow health checks.

## Local setup

1. Create a virtual environment (recommended):

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   ```

2. Install dependencies:

   ```bash
   python3 -m pip install -r requirements.txt
   ```

3. Optional: copy `.env.example` to `.env` and adjust dummy values (see `dflow.template.json` → `env` for declared names).

## Run

Default listen port is **8000** (same as manifest `port` and `healthCheck`):

```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

`GET /health` returns `200` with JSON `{"status":"ok"}`.

Deploy manifest: `dflow.template.json`.
