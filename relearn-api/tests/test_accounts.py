import asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from app.database import get_session
from app.main import create_app
from app.models import Base
from app.seed.demo_data import seed_demo_data


def test_accounts_and_record_isolation(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'accounts.db'}")
    sessions = async_sessionmaker(engine, expire_on_commit=False)

    async def prepare():
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        async with sessions() as session:
            await seed_demo_data(session)

    async def db():
        async with sessions() as session:
            yield session

    asyncio.run(prepare())
    app = create_app()
    app.dependency_overrides[get_session] = db
    headers = {"Origin": "http://localhost:3000"}
    try:
        with TestClient(app, headers=headers) as first, TestClient(app, headers=headers) as second:
            assert first.get("/api/v1/learning-plan").status_code == 401
            credentials = {"name": "One", "email": "one@example.com", "password": "a-long-test-password"}
            registered = first.post("/api/v1/auth/register", json=credentials)
            assert registered.status_code == 201
            assert "httponly" in registered.headers["set-cookie"].lower()
            first_id = registered.json()["id"]
            assert registered.json()["xp"] == 0
            assert registered.json()["streak"] == 0
            assert second.post("/api/v1/auth/register", json=credentials).status_code == 409
            assert second.post("/api/v1/auth/register", json={**credentials, "name": "Two", "email": "two@example.com"}).status_code == 201
            assert second.get(f"/api/v1/learners/{first_id}/progress").status_code == 403
            assert second.get(f"/api/v1/learning-plan?learnerId={first_id}").status_code == 403
            saved = first.put("/api/v1/auth/worlds/first-island", json={"completedLessonIds": ["variable-names"], "challengeCompleted": False, "coinsEarned": 9999})
            assert saved.json()["coinsEarned"] == 10
            assert second.get("/api/v1/auth/worlds/first-island").json()["completedLessonIds"] == []
            attempt = first.post("/api/v1/attempts", json={"learnerId": first_id, "exerciseId": "inclusive-sum-01", "submittedCode": "sum(range(1, n))", "testResults": {"passed": 1, "failed": 1, "cases": []}})
            assert attempt.status_code == 201
            attempt_id = attempt.json()["id"]
            assert second.post(f"/api/v1/attempts/{attempt_id}/diagnose").status_code == 404
            diagnosis = first.post(f"/api/v1/attempts/{attempt_id}/diagnose").json()
            diagnosis_id = diagnosis["diagnosis"]["id"]
            assert second.get(f"/api/v1/diagnoses/{diagnosis_id}").status_code == 404
            assert second.post(f"/api/v1/diagnoses/{diagnosis_id}/intervention").status_code == 404
            assert first.post("/api/v1/auth/logout", headers={"Origin": "https://untrusted.example"}).status_code == 403
            old_cookie = first.cookies.get("relearn_session")
            assert first.post("/api/v1/auth/logout").status_code == 200
            assert first.get("/api/v1/auth/me").status_code == 401
            assert first.get("/api/v1/auth/me", headers={"Cookie": f"relearn_session={old_cookie}"}).status_code == 401
            assert first.post("/api/v1/auth/login", json={"email": credentials["email"], "password": "wrong-password"}).status_code == 401
            assert first.post("/api/v1/auth/login", json=credentials).status_code == 200
            assert first.get("/api/v1/auth/worlds/first-island").json()["completedLessonIds"] == ["variable-names"]
    finally:
        app.dependency_overrides.clear()
        asyncio.run(engine.dispose())
