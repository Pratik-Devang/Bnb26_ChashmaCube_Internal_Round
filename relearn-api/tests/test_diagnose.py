from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_diagnose_success_return_parentheses():
    payload = {"code": "def add(a, b):\n    return(a + b)"}
    response = client.post("/diagnose", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "top_prediction" in data
    assert data["top_prediction"]["id"] == 31
    assert "return" in data["top_prediction"]["misconception"].lower()
    assert isinstance(data["top_prediction"]["score"], float)

    assert "alternatives" in data
    assert len(data["alternatives"]) == 2
    for alt in data["alternatives"]:
        assert "id" in alt
        assert "misconception" in alt
        assert "score" in alt

    assert "intervention" in data
    intervention = data["intervention"]
    assert intervention["title"] == "Understanding return statements"
    assert "parentheses are not required" in intervention["explanation"]
    assert intervention["example"] == "return a + b"
    assert intervention["check"] == "Try rewriting the return statement without parentheses."


def test_diagnose_empty_code_validation():
    response = client.post("/diagnose", json={"code": "   "})
    assert response.status_code == 400
    data = response.json()
    assert data["code"] == "EMPTY_CODE"


def test_diagnose_reassessment_resolved_and_unresolved():
    # 1. Unresolved: still predicts ID 31 when code retains return(...)
    unresolved_res = client.post(
        "/diagnose",
        json={"code": "def add(a, b):\n    return(a + b)", "previous_misconception_id": 31},
    )
    assert unresolved_res.status_code == 200
    reassess_unresolved = unresolved_res.json()["reassessment"]
    assert reassess_unresolved["status"] == "unresolved"
    assert reassess_unresolved["misconception_id"] == 31

    # 2. Resolved: top prediction changes away from 31
    resolved_res = client.post(
        "/diagnose",
        json={"code": "def add(a, b):\n    return a + b", "previous_misconception_id": 31},
    )
    assert resolved_res.status_code == 200
    reassess_resolved = resolved_res.json()["reassessment"]
    assert reassess_resolved["status"] == "resolved"
    assert reassess_resolved["misconception_id"] == 31
