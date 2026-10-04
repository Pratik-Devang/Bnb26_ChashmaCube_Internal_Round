import hashlib
import hmac
import secrets
import time
from collections import OrderedDict
from threading import Lock
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.config import get_settings
from app.database import get_session
from app.models.accounts import Account, AccountSession, WorldSave
from app.models.learner import Learner
from app.models.quests import Quest, LearnerQuest

COOKIE = "relearn_session"
SESSION_SECONDS = 60 * 60 * 24 * 7
_auth_windows: OrderedDict[str, tuple[float, int]] = OrderedDict()
_auth_lock = Lock()
router = APIRouter(prefix="/api/v1/auth", tags=["accounts"])


def limit_auth(request: Request):
    # Single-process development limiter. Deploy behind a shared edge limiter.
    key = request.client.host if request.client else "unknown"
    now = time.monotonic()
    with _auth_lock:
        start, count = _auth_windows.get(key, (now, 0))
        if now - start > 60:
            start, count = now, 0
        if count >= 20:
            raise HTTPException(429, "Too many attempts. Try again in a minute.", headers={"Retry-After": "60"})
        _auth_windows[key] = (start, count + 1)
        _auth_windows.move_to_end(key)
        if len(_auth_windows) > 10000:
            _auth_windows.popitem(last=False)


def check_origin(request: Request):
    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        if request.headers.get("origin") not in get_settings().cors_origins:
            raise HTTPException(403, "Untrusted request origin.")


def password_hash(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
    return f"{salt}:{digest}"


class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=10, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str):
        value = value.strip().lower()
        if value.count("@") != 1 or any(c.isspace() for c in value) or not all(value.split("@")):
            raise ValueError("Enter a valid email address.")
        return value


class Registration(Credentials):
    name: str = Field(min_length=1, max_length=120)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str):
        if not value.strip():
            raise ValueError("Enter your name.")
        return value.strip()


def user_data(learner: Learner):
    return {"id": learner.id, "name": learner.display_name, "avatar": learner.avatar, "xp": learner.xp, "streak": learner.streak, "level": learner.xp // 500 + 1}


async def current_user(request: Request, response: Response, session: AsyncSession = Depends(get_session)) -> Learner:
    response.headers["Cache-Control"] = "no-store"
    check_origin(request)
    token = request.cookies.get(COOKIE, "")
    saved = await session.get(AccountSession, hashlib.sha256(token.encode()).hexdigest()) if token else None
    if saved is None or saved.expires_at <= int(time.time()):
        raise HTTPException(401, "Sign in to continue.")
    learner = await session.get(Learner, saved.learner_id)
    if learner is None:
        raise HTTPException(401, "Sign in to continue.")
    if request.headers.get("x-learner-id", learner.id) != learner.id:
        raise HTTPException(409, "Your account changed in another tab. Refresh before continuing.")
    return learner


async def issue_session(response: Response, session: AsyncSession, learner: Learner):
    token = secrets.token_urlsafe(32)
    session.add(AccountSession(token_hash=hashlib.sha256(token.encode()).hexdigest(), learner_id=learner.id, expires_at=int(time.time()) + SESSION_SECONDS))
    await session.commit()
    response.set_cookie(COOKIE, token, max_age=SESSION_SECONDS, httponly=True, secure=get_settings().environment != "development", samesite="lax", path="/")
    response.headers["Cache-Control"] = "no-store"
    return user_data(learner)


@router.post("/register", status_code=201, dependencies=[Depends(check_origin), Depends(limit_auth)])
async def register(payload: Registration, response: Response, session: AsyncSession = Depends(get_session)):
    learner = Learner(id=f"learner-{uuid4().hex}", display_name=payload.name, avatar="explorer", xp=0, streak=0)
    session.add(learner)
    await session.flush()
    available_quests = (await session.scalars(select(Quest))).all()
    session.add(Account(learner_id=learner.id, email=payload.email, password_hash=await run_in_threadpool(password_hash, payload.password)))
    for quest in available_quests:
        session.add(LearnerQuest(learner_id=learner.id, quest_id=quest.id, progress=0))
    try:
        return await issue_session(response, session, learner)
    except IntegrityError:
        await session.rollback()
        raise HTTPException(409, "Unable to create this account. Try signing in.")


@router.post("/login", dependencies=[Depends(check_origin), Depends(limit_auth)])
async def login(payload: Credentials, response: Response, session: AsyncSession = Depends(get_session)):
    account = await session.scalar(select(Account).where(Account.email == payload.email))
    # Perform the same expensive operation even for unknown email addresses.
    salt = account.password_hash.split(":")[0] if account else "0" * 32
    candidate = await run_in_threadpool(password_hash, payload.password, salt)
    if account is None or not hmac.compare_digest(candidate, account.password_hash):
        raise HTTPException(401, "Email or password is incorrect.")
    learner = await session.get(Learner, account.learner_id)
    return await issue_session(response, session, learner)


@router.get("/me")
async def me(response: Response, learner: Learner = Depends(current_user)):
    response.headers["Cache-Control"] = "no-store"
    return user_data(learner)


@router.post("/logout", dependencies=[Depends(check_origin)])
async def logout(request: Request, response: Response, session: AsyncSession = Depends(get_session)):
    saved = await session.get(AccountSession, hashlib.sha256(request.cookies.get(COOKIE, "").encode()).hexdigest())
    if saved:
        await session.delete(saved)
        await session.commit()
    response.delete_cookie(COOKIE, path="/")
    return {"ok": True}


class IslandSave(BaseModel):
    completedLessonIds: list[str] = Field(default_factory=list, max_length=30)
    challengeCompleted: bool = False
    coinsEarned: int = Field(default=0, ge=0, le=10000)

    @field_validator("completedLessonIds")
    @classmethod
    def valid_lessons(cls, values):
        allowed = {"variable-names", "value-types", "changing-values", "clear-names", "variable-mistakes", "assignment-comparison"}
        if any(value not in allowed for value in values) or len(values) != len(set(values)):
            raise ValueError("Invalid island lesson progress.")
        return values


class Preferences(BaseModel):
    sound: bool = True
    reminders: bool = True
    goal: int = Field(default=15)

    @field_validator("goal")
    @classmethod
    def valid_goal(cls, value):
        if value not in {10, 15, 20, 30}:
            raise ValueError("Select a supported daily goal.")
        return value


@router.get("/preferences")
async def load_preferences(learner: Learner = Depends(current_user), session: AsyncSession = Depends(get_session)):
    saved = await session.get(WorldSave, (learner.id, "preferences"))
    return saved.progress if saved else Preferences().model_dump()


@router.put("/preferences")
async def save_preferences(payload: Preferences, learner: Learner = Depends(current_user), session: AsyncSession = Depends(get_session)):
    saved = await session.get(WorldSave, (learner.id, "preferences"))
    if saved is None:
        saved = WorldSave(learner_id=learner.id, world_id="preferences", progress={})
        session.add(saved)
    saved.progress = payload.model_dump()
    await session.commit()
    return saved.progress


@router.get("/worlds/first-island")
async def load_world(learner: Learner = Depends(current_user), session: AsyncSession = Depends(get_session)):
    saved = await session.get(WorldSave, (learner.id, "first-island"))
    return saved.progress if saved else IslandSave().model_dump()


@router.put("/worlds/first-island")
async def save_world(payload: IslandSave, learner: Learner = Depends(current_user), session: AsyncSession = Depends(get_session)):
    saved = await session.get(WorldSave, (learner.id, "first-island"))
    if saved is None:
        saved = WorldSave(learner_id=learner.id, world_id="first-island", progress={})
        session.add(saved)
    progress = payload.model_dump()
    progress["coinsEarned"] = len(payload.completedLessonIds) * 10 + (50 if payload.challengeCompleted else 0)
    saved.progress = progress
    await session.commit()
    return saved.progress
