# Re:Learn API

FastAPI modular monolith for exercises, learner attempts, misconception diagnoses, interventions, reassessments, progress, quests, and XP.

The backend exposes the complete hackathon API surface for learning plans, exercises, attempts, diagnoses, interventions, reassessments, progress, quests, XP, and model metrics. A replaceable diagnosis-provider interface currently uses a deterministic rule-based provider until the trained artifact is connected. It does **not** execute learner code; predefined Python tests remain the responsibility of the browser’s restricted Pyodide worker.

## API surface

All product endpoints are under `/api/v1`:

- `GET /learning-plan`
- `GET /exercises/{exercise_id}`
- `POST /attempts`
- `POST /attempts/{attempt_id}/diagnose`
- `GET /diagnoses/{diagnosis_id}`
- `POST /diagnoses/{diagnosis_id}/intervention`
- `POST /interventions/{intervention_id}/complete`
- `POST /reassessments`
- `GET /learners/{learner_id}/progress`
- `GET /learners/{learner_id}/quests`
- `POST /quests/{quest_id}/complete`
- `GET /model/metrics`

Diagnosis and intervention creation are idempotent. Quest rewards are granted only once. Reassessment state changes follow the deterministic resolution rules in `docs/ARCHITECTURE.md`.

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

## Create and seed the database

After PostgreSQL is running and `.env` contains the correct connection string:

```powershell
alembic upgrade head
python -m app.seed.demo_data
```

The seed command is repeatable and restores the deterministic demo learner, concepts, misconceptions, one starter coding exercise for each of the six learning topics, two boundary transfer exercises, intervention content, quests, and initial progress state. It does not create ML training examples.

## Architecture boundaries

- `app/api/` owns HTTP routing only.
- `app/schemas/` defines Pydantic transport and service contracts.
- `app/services/` owns diagnosis, intervention, progress, and quest rules.
- SQLAlchemy models, Alembic migrations, and database-backed API workflows are implemented.
- The ML classifier will implement `DiagnosisProvider`; API routes will not import model-specific code.

## Configuration

All environment variables use the `RELEARN_` prefix. Production environments must supply `RELEARN_DATABASE_URL` and explicit CORS origins.
