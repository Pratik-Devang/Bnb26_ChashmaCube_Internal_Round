# Re:Learn API

FastAPI modular monolith for exercises, learner attempts, misconception diagnoses, interventions, reassessments, progress, quests, and XP.

This first backend batch contains the application foundation and a replaceable diagnosis-provider interface. The temporary rule-based provider performs static inspection only. It does **not** execute learner code; predefined Python tests remain the responsibility of the browser’s restricted Pyodide worker.

## Local setup

Requirements: Python 3.11+, PostgreSQL, and a virtual environment.

```powershell
cd relearn-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

Check the service at `http://localhost:8000/health` and the generated API documentation at `http://localhost:8000/docs`.

## Architecture boundaries

- `app/api/` owns HTTP routing only.
- `app/schemas/` defines Pydantic transport and service contracts.
- `app/services/` owns diagnosis, intervention, progress, and quest rules.
- Database models and repositories will be added in the next batch.
- The ML classifier will implement `DiagnosisProvider`; API routes will not import model-specific code.

## Configuration

All environment variables use the `RELEARN_` prefix. Production environments must supply `RELEARN_DATABASE_URL` and explicit CORS origins.
