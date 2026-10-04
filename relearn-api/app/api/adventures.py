"""Topic adventures: authored curriculum and server-checked, account-scoped progress."""
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.accounts import current_user
from app.database import get_session
from app.models.accounts import WorldSave
from app.models.learner import Learner

router = APIRouter(prefix="/api/v1/auth/adventures", tags=["adventures"])
CATALOG = json.loads((Path(__file__).parent.parent / "data" / "adventure_curriculum.json").read_text(encoding="utf-8"))
TRACKS = {track["id"]: track for track in CATALOG}
World = Literal["first-island", "chapel-of-choices"]


class Selection(BaseModel):
    world: World
    track: str = Field(max_length=40)


class LessonAction(Selection):
    lessonId: str = Field(max_length=30)


class AnswerAction(Selection):
    questionId: str = Field(max_length=30)
    answer: int = Field(ge=0, le=10)


def track_for(track_id):
    if track_id not in TRACKS:
        raise HTTPException(404, "This topic and difficulty are not available.")
    return TRACKS[track_id]


def key(world, track):
    return f"adventure:{world}:{track}"


def empty(world, track):
    return {"world": world, "track": track, "completedLessonIds": [], "passedQuestionIds": [],
            "completed": False, "coinsEarned": 0, "attemptCount": 0, "mistakeCount": 0,
            "attempts": [], "updatedAt": None}


async def locked_save(session, learner, world, track):
    # Serializes starts and answers even when a save does not exist yet.
    await session.scalar(select(Learner).where(Learner.id == learner.id).with_for_update())
    saved = await session.get(WorldSave, (learner.id, key(world, track)))
    if saved is None:
        saved = WorldSave(learner_id=learner.id, world_id=key(world, track), progress=empty(world, track))
        session.add(saved)
    return saved


async def remember(session, learner, world, track):
    recent = await session.get(WorldSave, (learner.id, "adventure:recent"))
    if recent is None:
        recent = WorldSave(learner_id=learner.id, world_id="adventure:recent", progress={})
        session.add(recent)
    recent.progress = {"world": world, "track": track}


@router.get("/catalog")
async def catalog(learner: Learner = Depends(current_user)):
    return [{**track, "questions": [{k: v for k, v in question.items() if k not in {"answer", "feedback"}}
                                    for question in track["questions"]]} for track in CATALOG]


@router.get("/progress")
async def progress(learner: Learner = Depends(current_user), session: AsyncSession = Depends(get_session)):
    saves = (await session.scalars(select(WorldSave).where(
        WorldSave.learner_id == learner.id, WorldSave.world_id.like("adventure:%")))).all()
    recent = next((saved.progress for saved in saves if saved.world_id == "adventure:recent"), None)
    return {"recent": recent, "saves": [saved.progress for saved in saves if saved.world_id != "adventure:recent"]}


@router.post("/start")
async def start(payload: Selection, learner: Learner = Depends(current_user), session: AsyncSession = Depends(get_session)):
    track_for(payload.track)
    saved = await locked_save(session, learner, payload.world, payload.track)
    saved.progress = {**saved.progress, "updatedAt": datetime.now(timezone.utc).isoformat()}
    await remember(session, learner, payload.world, payload.track)
    await session.commit()
    return saved.progress


@router.post("/lesson")
async def lesson(payload: LessonAction, learner: Learner = Depends(current_user), session: AsyncSession = Depends(get_session)):
    track = track_for(payload.track)
    order = [item["id"] for item in track["lessons"]]
    if payload.lessonId not in order:
        raise HTTPException(404, "Lesson not found.")
    saved = await locked_save(session, learner, payload.world, payload.track)
    data = {**saved.progress}
    completed = list(data["completedLessonIds"])
    if payload.lessonId not in completed:
        if payload.lessonId != order[len(completed)]:
            raise HTTPException(409, "Visit the earlier guide first.")
        completed.append(payload.lessonId)
    data.update(completedLessonIds=completed, coinsEarned=len(completed) * 10 + (50 if data["completed"] else 0),
                updatedAt=datetime.now(timezone.utc).isoformat())
    saved.progress = data
    await remember(session, learner, payload.world, payload.track)
    await session.commit()
    return data


@router.post("/answer")
async def answer(payload: AnswerAction, learner: Learner = Depends(current_user), session: AsyncSession = Depends(get_session)):
    track = track_for(payload.track)
    question = next((q for q in track["questions"] if q["id"] == payload.questionId), None)
    if question is None or payload.answer >= len(question["options"]):
        raise HTTPException(422, "Choose an available answer.")
    saved = await locked_save(session, learner, payload.world, payload.track)
    data = {**saved.progress}
    if len(data["completedLessonIds"]) != len(track["lessons"]):
        raise HTTPException(409, "Finish the guide lessons before this trial.")
    passed = list(data["passedQuestionIds"])
    if payload.questionId not in passed and payload.questionId != track["questions"][len(passed)]["id"]:
        raise HTTPException(409, "Complete the earlier question first.")
    correct = payload.answer == question["answer"]
    if payload.questionId not in passed:
        data["attemptCount"] += 1
        data["mistakeCount"] += int(not correct)
        data["attempts"] = (data["attempts"] + [{"questionId": payload.questionId, "answer": payload.answer,
            "correct": correct, "at": datetime.now(timezone.utc).isoformat()}])[-30:]
        if correct:
            passed.append(payload.questionId)
    done = len(passed) == len(track["questions"])
    data.update(passedQuestionIds=passed, completed=done, coinsEarned=len(data["completedLessonIds"]) * 10 + (50 if done else 0),
                updatedAt=datetime.now(timezone.utc).isoformat())
    saved.progress = data
    await remember(session, learner, payload.world, payload.track)
    await session.commit()
    return {"progress": data, "correct": correct, "feedback": question["feedback"], "source": "authored"}
