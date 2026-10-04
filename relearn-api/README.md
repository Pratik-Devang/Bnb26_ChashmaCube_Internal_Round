# Re:Learn API

FastAPI modular monolith for exercises, learner attempts, misconception diagnoses, interventions, reassessments, progress, quests, and XP.

The backend exposes the complete hackathon API surface for learning plans, exercises, attempts, diagnoses, interventions, reassessments, progress, quests, XP, and model metrics. A replaceable diagnosis-provider interface currently uses a deterministic rule-based provider until the trained artifact is connected. It does **not** execute learner code; predefined Python tests remain the responsibility of the browser’s restricted Pyodide worker.

## API surface

- `POST /diagnose` (Direct ML Misconception Classifier endpoint)

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

## ML Misconception Diagnosis Endpoint (`/diagnose`)

The `POST /diagnose` endpoint loads the trained LinearSVC misconception model (`relearn-ml/models/misconception_model.pkl`) and TF-IDF vectorizer (`relearn-ml/models/tfidf_vectorizer.pkl`) to predict top-3 misconceptions from student Python code, provide targeted interventions from the knowledge base, and evaluate reassessment resolution.

### Request Example

```http
POST /diagnose
Content-Type: application/json

{
  "code": "def add(a, b):\n    return(a + b)"
}
```

Optional reassessment payload:
```json
{
  "code": "def add(a, b):\n    return a + b",
  "previous_misconception_id": 31
}
```

### Response Example

```json
{
  "top_prediction": {
    "id": 31,
    "misconception": "Student believes that the `return` statement requires parentheses around its argument.",
    "score": 0.325
  },
  "alternatives": [
    {
      "id": 56,
      "misconception": "Student uses incorrect argument count or mismatches positional and keyword arguments.",
      "score": -0.54
    },
    {
      "id": 46,
      "misconception": "Student misplaces indentation causing block association errors.",
      "score": -0.815
    }
  ],
  "intervention": {
    "title": "Understanding return statements",
    "explanation": "In Python, parentheses are not required around the value returned by a function.",
    "example": "return a + b",
    "check": "Try rewriting the return statement without parentheses."
  },
  "reassessment": null
}
```

When `previous_misconception_id` is supplied:
```json
{
  "reassessment": {
    "status": "resolved",
    "misconception_id": 31
  }
}
```

## Local setup

Requirements: Python 3.11+ and a virtual environment. Local development uses the project-root `relearn-local.sqlite3` database by default. Set `RELEARN_DATABASE_URL` to use PostgreSQL or another configured database.

### 1. Install dependencies
```powershell
cd relearn-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
```

Or install directly with pip:
```powershell
python -m pip install "fastapi>=0.115,<1" "uvicorn[standard]>=0.34,<1" "pydantic-settings>=2.7,<3" "joblib>=1.3,<2" "scikit-learn>=1.4,<2" "numpy>=1.26,<3" "sqlalchemy[asyncio]>=2.0,<3" "psycopg[binary]>=3.2,<4" "alembic>=1.14,<2"
```

### 2. Start the backend
```powershell
uvicorn app.main:app --reload --port 8000
```

Check the service at `http://localhost:8000/health` and the Swagger UI at `http://localhost:8000/docs`.

## Create and seed the database

For local SQLite development, the API creates the tables and seeds an empty database on startup. To use PostgreSQL, set `RELEARN_DATABASE_URL` in `.env`, start PostgreSQL, then run:

```powershell
alembic upgrade head
python -m app.seed.demo_data
```

The seed command is repeatable and restores the deterministic demo learner, concepts, misconceptions, one starter coding exercise for each of the six learning topics, two boundary transfer exercises, intervention content, quests, and initial progress state. It does not create ML training examples.

## Architecture boundaries

- `app/api/` owns HTTP routing only (`/diagnose`, `/health`, `/learning`).
- `app/schemas/` defines Pydantic transport and service contracts (`ml_diagnosis.py`, `diagnoses.py`, `learning.py`).
- `app/services/` owns diagnosis, intervention, progress, and quest rules:
  - `ml_service.py` provides ML misconception inference and intervention mapping from `relearn-ml/models/`.
  - `diagnosis_service.py` provides exercise rule-based provider.
- SQLAlchemy models, Alembic migrations, and database-backed API workflows are implemented.

## Configuration

All environment variables use the `RELEARN_` prefix. Production environments must supply `RELEARN_DATABASE_URL` and explicit CORS origins.
`RELEARN_ML_MODELS_DIR` can optionally specify a custom path to the directory containing `misconception_model.pkl` and `tfidf_vectorizer.pkl`.
