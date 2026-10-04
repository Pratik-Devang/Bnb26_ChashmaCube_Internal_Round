"""Fail closed before learning routes can read or mutate private records."""
from json import JSONDecodeError
from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.accounts import current_user
from app.database import get_session
from app.models.learner import Learner
from app.models.attempts import Attempt, Diagnosis
from app.models.interventions import Intervention


async def require_ownership(request: Request, learner: Learner = Depends(current_user), session: AsyncSession = Depends(get_session)):
    session.info["learner_id"] = learner.id
    try:
        body = await request.json() if request.method in {"POST", "PUT", "PATCH"} and await request.body() else {}
    except JSONDecodeError:
        raise HTTPException(422, "Expected valid JSON.")
    if not isinstance(body, dict):
        raise HTTPException(422, "Expected an object.")
    for claimed in (request.query_params.get("learnerId"), request.path_params.get("learner_id"), body.get("learnerId"), body.get("learner_id")):
        if claimed is not None and claimed != learner.id:
            raise HTTPException(403, "This learner record belongs to another account.")

    async def own_attempt(identifier):
        attempt = await session.get(Attempt, identifier)
        if attempt is None or attempt.learner_id != learner.id:
            raise HTTPException(404, "Record not found.")

    async def own_diagnosis(identifier):
        diagnosis = await session.get(Diagnosis, identifier)
        if diagnosis is None:
            raise HTTPException(404, "Record not found.")
        await own_attempt(diagnosis.attempt_id)

    for identifier in (request.path_params.get("attempt_id"), body.get("parentAttemptId"), body.get("parent_attempt_id")):
        if identifier:
            await own_attempt(identifier)
    if request.path_params.get("diagnosis_id"):
        await own_diagnosis(request.path_params["diagnosis_id"])
    for identifier in (request.path_params.get("intervention_id"), body.get("interventionId"), body.get("intervention_id")):
        if identifier:
            intervention = await session.get(Intervention, identifier)
            if intervention is None:
                raise HTTPException(404, "Record not found.")
            await own_diagnosis(intervention.diagnosis_id)
