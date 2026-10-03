# Re:Learn API contracts

Base path: `/api/v1`. JSON uses camelCase at the HTTP boundary; the future Pydantic schemas may use aliases over snake_case Python fields. Error responses should include a stable `code`, a safe `message`, and optional field-level `details`.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/learning-plan` | Return the learner, ordered modules, statistics, and active path state. |
| `GET` | `/exercises/{exercise_id}` | Return one exercise and its predefined browser test cases. |
| `POST` | `/attempts` | Store learner code, explanation, and browser test results. |
| `POST` | `/attempts/{attempt_id}/diagnose` | Run feature extraction and classifier inference for a stored attempt. |
| `GET` | `/diagnoses/{diagnosis_id}` | Return a diagnosis, evidence, probabilities, and model version. |
| `POST` | `/diagnoses/{diagnosis_id}/intervention` | Select or create the deterministic learning intervention. |
| `POST` | `/interventions/{intervention_id}/complete` | Record mini-game completion and assign reassessment work. |
| `POST` | `/reassessments` | Store and assess a near- or far-transfer attempt. |
| `GET` | `/learners/{learner_id}/progress` | Return concept states and mastery evidence. |
| `GET` | `/learners/{learner_id}/quests` | Return daily quest state and rewards. |
| `POST` | `/quests/{quest_id}/complete` | Complete an eligible quest and return updated XP. |
| `GET` | `/model/metrics` | Return the active classifier version and approved evaluation metrics. |

## Submit an attempt

`POST /api/v1/attempts`

```json
{
  "learnerId": "learner-demo",
  "exerciseId": "inclusive-sum-01",
  "submittedCode": "total = 0\nfor i in range(1, n):\n    total += i",
  "learnerExplanation": "I expected range to include n.",
  "attemptType": "INITIAL",
  "testResults": {
    "passed": 2,
    "failed": 2,
    "cases": [
      {
        "input": { "n": 5 },
        "expected": 15,
        "actual": 10,
        "passed": false
      }
    ]
  }
}
```

Response `201 Created`:

```json
{
  "id": "attempt-123",
  "learnerId": "learner-demo",
  "exerciseId": "inclusive-sum-01",
  "createdAt": "2026-10-03T11:15:00Z"
}
```

The backend stores the supplied test result as evidence but validates its shape and extracts AST features itself. It never executes the submitted code.

## Diagnose an attempt

`POST /api/v1/attempts/attempt-123/diagnose`

```json
{
  "attemptId": "attempt-123",
  "diagnosis": {
    "id": "diagnosis-123",
    "misconceptionCode": "RANGE_ENDPOINT_EXCLUDED",
    "learnerFriendlyName": "Boundary bug",
    "confidence": 0.87,
    "summary": "Your loop stops one step before the final number.",
    "evidence": [
      {
        "type": "code",
        "line": 2,
        "message": "range(1, n) stops before n."
      },
      {
        "type": "test",
        "message": "The result is missing the final value."
      }
    ],
    "classProbabilities": {
      "RANGE_ENDPOINT_EXCLUDED": 0.87,
      "WRONG_INITIALIZATION": 0.05,
      "ACCUMULATOR_OVERWRITTEN": 0.03,
      "WRONG_OR_MISSING_UPDATE": 0.03,
      "VARIABLE_ROLE_CONFUSION": 0.02
    },
    "modelVersion": "tfidf-logreg-2026-10-01"
  },
  "intervention": {
    "id": "intervention-123",
    "type": "RANGE_PATH_GAME",
    "title": "Help Byte reach the final tile",
    "estimatedMinutes": 2
  },
  "reassessmentExerciseId": "list-traversal-04"
}
```

Low-confidence output uses `UNCERTAIN`, retains the previous learner state, and does not silently select a specific misconception game.

## Progress response

`GET /api/v1/learners/learner-demo/progress`

```json
{
  "learnerId": "learner-demo",
  "concepts": [
    {
      "conceptId": "loop-boundaries",
      "concept": "Loop boundaries",
      "status": "IMPROVING",
      "masteryScore": 0.64,
      "evidenceCount": 3,
      "lastMisconceptionCode": "RANGE_ENDPOINT_EXCLUDED",
      "updatedAt": "2026-10-03T11:25:00Z"
    }
  ]
}
```

Valid understanding states are `UNTESTED`, `NEEDS_PRACTICE`, `IMPROVING`, and `RESOLVED`.

## Reassessment request

`POST /api/v1/reassessments`

Uses the attempt payload plus an `interventionId`, `parentAttemptId`, and `attemptType` of `NEAR_TRANSFER` or `FAR_TRANSFER`. The response uses the diagnosis shape above and includes the resulting concept state. State transitions follow the deterministic rules in `ARCHITECTURE.md`.

## Frontend mapping

The matching TypeScript interfaces live in `relearn-web/types/learning.ts`. The typed functions in `relearn-web/lib/api.ts` currently return mock promises. When FastAPI is available, only that module should add `fetch` calls using `NEXT_PUBLIC_API_BASE_URL`; dashboard components must not hardcode endpoints or import transport-specific response details.
