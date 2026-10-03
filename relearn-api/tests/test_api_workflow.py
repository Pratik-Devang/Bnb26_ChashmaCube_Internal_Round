from collections.abc import AsyncIterator
import asyncio

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import get_session
from app.main import app
from app.models.base import Base
from app.seed.demo_data import seed_demo_data


def test_complete_learning_workflow(tmp_path) -> None:
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'workflow.db'}")
    sessions = async_sessionmaker(engine, expire_on_commit=False)

    async def prepare() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        async with sessions() as session:
            await seed_demo_data(session)

    async def override_session() -> AsyncIterator[AsyncSession]:
        async with sessions() as session:
            yield session

    asyncio.run(prepare())
    app.dependency_overrides[get_session] = override_session
    try:
        with TestClient(app) as client:
            plan = client.get("/api/v1/learning-plan").json()
            assert plan["learner"]["id"] == "learner-demo"
            assert len(plan["modules"]) == 6
            premature_reward = client.post("/api/v1/quests/quest-transfer/complete", json={"learnerId": "learner-demo"})
            assert premature_reward.status_code == 409
            assert premature_reward.json()["code"] == "QUEST_NOT_ELIGIBLE"

            exercise = client.get("/api/v1/exercises/inclusive-sum-01")
            assert exercise.status_code == 200
            missing = client.get("/api/v1/exercises/does-not-exist")
            assert missing.status_code == 404
            assert missing.json()["code"] == "EXERCISE_NOT_FOUND"

            initial = client.post(
                "/api/v1/attempts",
                json={
                    "learnerId": "learner-demo",
                    "exerciseId": "inclusive-sum-01",
                    "submittedCode": "total = 0\nfor i in range(1, n):\n    total += i",
                    "learnerExplanation": "I expected n to be included.",
                    "attemptType": "INITIAL",
                    "testResults": {"passed": 1, "failed": 2, "cases": []},
                },
            )
            assert initial.status_code == 201
            initial_id = initial.json()["id"]

            diagnosed = client.post(f"/api/v1/attempts/{initial_id}/diagnose")
            assert diagnosed.status_code == 200
            diagnosis = diagnosed.json()
            assert diagnosis["diagnosis"]["misconceptionCode"] == "RANGE_ENDPOINT_EXCLUDED"
            assert diagnosis["conceptStatus"] == "NEEDS_PRACTICE"
            intervention_id = diagnosis["intervention"]["id"]

            completed = client.post(
                f"/api/v1/interventions/{intervention_id}/complete",
                json={"learnerId": "learner-demo"},
            )
            assert completed.status_code == 200
            assert completed.json()["nearTransferExerciseId"] == "list-traversal-04"

            near = client.post(
                "/api/v1/reassessments",
                json={
                    "learnerId": "learner-demo",
                    "exerciseId": "list-traversal-04",
                    "submittedCode": "def add_items(values):\n    return sum(values)",
                    "attemptType": "NEAR_TRANSFER",
                    "parentAttemptId": initial_id,
                    "interventionId": intervention_id,
                    "testResults": {"passed": 3, "failed": 0, "cases": []},
                },
            )
            assert near.status_code == 201, near.text
            assert near.json()["conceptStatus"] == "IMPROVING"
            near_id = near.json()["attemptId"]

            far = client.post(
                "/api/v1/reassessments",
                json={
                    "learnerId": "learner-demo",
                    "exerciseId": "multiples-through-n-02",
                    "submittedCode": "def count_multiples(n, step):\n    return n // step",
                    "attemptType": "FAR_TRANSFER",
                    "parentAttemptId": near_id,
                    "interventionId": intervention_id,
                    "testResults": {"passed": 3, "failed": 0, "cases": []},
                },
            )
            assert far.status_code == 201, far.text
            assert far.json()["conceptStatus"] == "RESOLVED"

            progress = client.get("/api/v1/learners/learner-demo/progress").json()
            loop_state = next(item for item in progress["concepts"] if item["conceptId"] == "concept-loop-boundaries")
            assert loop_state["status"] == "RESOLVED"

            first_reward = client.post("/api/v1/quests/quest-transfer/complete", json={"learnerId": "learner-demo"}).json()
            repeated_reward = client.post("/api/v1/quests/quest-transfer/complete", json={"learnerId": "learner-demo"}).json()
            assert first_reward["xpAwarded"] == 150
            assert repeated_reward["xpAwarded"] == 0
            assert repeated_reward["learnerXp"] == first_reward["learnerXp"]

            metrics = client.get("/api/v1/model/metrics")
            assert metrics.status_code == 200
            assert metrics.json()["name"] == "rule-based-demo-v1"
    finally:
        app.dependency_overrides.clear()
        asyncio.run(engine.dispose())
