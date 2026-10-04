from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.api.ownership import require_ownership
from app.models.attempts import Attempt, Diagnosis
from app.models.enums import AttemptType, ConceptStatus, QuestStatus
from app.models.interventions import Intervention, LearnerConceptState
from app.models.learning import Concept, Exercise, Misconception
from app.models.learner import Learner
from app.models.model_version import ModelVersion
from app.models.quests import LearnerQuest, Quest
from app.schemas.diagnoses import AttemptForDiagnosis, DiagnosisEvidence, DiagnosisPrediction, MisconceptionCode
from app.schemas.learning import (
    AttemptCreate,
    AttemptRead,
    ConceptProgress,
    CodeReviewCreate,
    CodeReviewRead,
    DiagnosisEnvelope,
    DiagnosisRead,
    ExerciseRead,
    InterventionComplete,
    InterventionCompletion,
    InterventionRead,
    LearnerRead,
    LearningModuleRead,
    LearningPlanRead,
    LearningStatistics,
    ModelMetricsRead,
    ProgressRead,
    QuestComplete,
    QuestCompletion,
    QuestRead,
    ReassessmentCreate,
)
from app.seed.demo_data import INTERVENTION_CONTENT_BY_CODE
from app.services.diagnosis_service import RuleBasedDiagnosisProvider
from app.services.gemini_review_service import GeminiCodeReviewService, GeminiReviewUnavailable, deterministic_review


router = APIRouter(prefix="/api/v1", tags=["learning"], dependencies=[Depends(require_ownership)])
provider = RuleBasedDiagnosisProvider()
reviewer = GeminiCodeReviewService()


async def _review_normalized(normalized: AttemptForDiagnosis, prediction: DiagnosisPrediction | None = None) -> CodeReviewRead:
    trusted = prediction or await provider.diagnose(normalized)
    try:
        return await reviewer.review(normalized, trusted)
    except GeminiReviewUnavailable:
        return deterministic_review(normalized, trusted)


def _not_found(kind: str, identifier: str) -> HTTPException:
    return HTTPException(status_code=404, detail={"code": f"{kind.upper()}_NOT_FOUND", "message": f"{kind.title()} '{identifier}' was not found."})


def _attempt_read(attempt: Attempt) -> AttemptRead:
    return AttemptRead.model_validate(attempt)


def _quest_read(quest: Quest, learner_quest: LearnerQuest) -> QuestRead:
    return QuestRead(
        id=quest.id,
        title=quest.title,
        description=quest.description,
        xp_reward=quest.xp_reward,
        quest_type=quest.quest_type,
        status=learner_quest.status,
        progress=learner_quest.progress,
        completed_at=learner_quest.completed_at,
    )


async def _get_attempt(session: AsyncSession, attempt_id: str) -> Attempt:
    attempt = await session.get(Attempt, attempt_id)
    if attempt is None:
        raise _not_found("attempt", attempt_id)
    return attempt


async def _get_intervention(session: AsyncSession, intervention_id: str) -> Intervention:
    intervention = await session.get(Intervention, intervention_id)
    if intervention is None:
        raise _not_found("intervention", intervention_id)
    return intervention


async def _intervention_for_diagnosis(session: AsyncSession, diagnosis: Diagnosis, misconception: Misconception) -> Intervention:
    intervention = await session.scalar(select(Intervention).where(Intervention.diagnosis_id == diagnosis.id))
    if intervention is not None:
        return intervention

    content = dict(INTERVENTION_CONTENT_BY_CODE.get(misconception.code, {}))
    content.setdefault("type", misconception.intervention_type)
    content.setdefault("title", "Review the idea with one guided example")
    content.setdefault("estimatedMinutes", 3)
    intervention = Intervention(
        id=f"intervention-{uuid4().hex}",
        diagnosis_id=diagnosis.id,
        intervention_type=misconception.intervention_type,
        content=content,
        completed_at=None,
    )
    session.add(intervention)
    await session.flush()
    return intervention


def _intervention_read(intervention: Intervention) -> InterventionRead:
    return InterventionRead(
        id=intervention.id,
        diagnosis_id=intervention.diagnosis_id,
        type=intervention.intervention_type,
        title=str(intervention.content.get("title", "Guided review")),
        estimated_minutes=int(intervention.content.get("estimatedMinutes", 3)),
        content=intervention.content,
        completed_at=intervention.completed_at,
    )


async def _diagnosis_read(session: AsyncSession, diagnosis: Diagnosis) -> DiagnosisRead:
    misconception = await session.get(Misconception, diagnosis.misconception_id)
    model_version = await session.get(ModelVersion, diagnosis.model_version_id)
    if misconception is None or model_version is None:
        raise HTTPException(status_code=500, detail={"code": "DIAGNOSIS_REFERENCE_MISSING", "message": "Stored diagnosis references are incomplete."})
    evidence = [DiagnosisEvidence.model_validate(item) for item in diagnosis.evidence]
    summary = evidence[0].message if evidence else misconception.learner_friendly_name
    return DiagnosisRead(
        id=diagnosis.id,
        misconception_code=MisconceptionCode(misconception.code),
        learner_friendly_name=misconception.learner_friendly_name,
        confidence=diagnosis.confidence,
        summary=summary,
        evidence=evidence,
        class_probabilities=diagnosis.class_probabilities,
        model_version=model_version.name,
    )


async def _diagnosis_envelope(session: AsyncSession, attempt: Attempt, diagnosis: Diagnosis) -> DiagnosisEnvelope:
    misconception = await session.get(Misconception, diagnosis.misconception_id)
    if misconception is None:
        raise HTTPException(status_code=500, detail={"code": "MISCONCEPTION_REFERENCE_MISSING", "message": "Stored misconception is unavailable."})
    intervention = await _intervention_for_diagnosis(session, diagnosis, misconception)
    state = await session.scalar(
        select(LearnerConceptState)
        .join(Exercise, LearnerConceptState.concept_id == Exercise.concept_id)
        .where(LearnerConceptState.learner_id == attempt.learner_id, Exercise.id == attempt.exercise_id)
    )
    reassessment_id = intervention.content.get("nearTransferExerciseId")
    if attempt.attempt_type == AttemptType.NEAR_TRANSFER:
        reassessment_id = intervention.content.get("farTransferExerciseId")
    return DiagnosisEnvelope(
        attempt_id=attempt.id,
        diagnosis=await _diagnosis_read(session, diagnosis),
        intervention=_intervention_read(intervention),
        reassessment_exercise_id=str(reassessment_id) if reassessment_id else None,
        concept_status=state.status if state else None,
    )


async def _apply_concept_evidence(
    session: AsyncSession,
    attempt: Attempt,
    exercise: Exercise,
    prediction: DiagnosisPrediction,
    misconception: Misconception,
) -> ConceptStatus:
    state = await session.scalar(
        select(LearnerConceptState).where(
            LearnerConceptState.learner_id == attempt.learner_id,
            LearnerConceptState.concept_id == exercise.concept_id,
        )
    )
    if state is None:
        state = LearnerConceptState(
            id=f"state-{uuid4().hex}", learner_id=attempt.learner_id, concept_id=exercise.concept_id,
            misconception_id=None, status=ConceptStatus.UNTESTED, evidence_count=0, mastery_score=0,
            last_attempt_id=None,
        )
        session.add(state)

    code = prediction.misconception_code
    previous = state.status
    if code == MisconceptionCode.UNCERTAIN:
        pass
    elif code != MisconceptionCode.CORRECT:
        state.status = ConceptStatus.NEEDS_PRACTICE
        state.mastery_score = max(0.1, state.mastery_score - 0.08)
        state.misconception_id = misconception.id
    elif attempt.attempt_type == AttemptType.NEAR_TRANSFER:
        state.status = ConceptStatus.IMPROVING
        state.mastery_score = max(state.mastery_score, 0.65)
        state.misconception_id = None
    elif attempt.attempt_type == AttemptType.FAR_TRANSFER and previous == ConceptStatus.IMPROVING:
        state.status = ConceptStatus.RESOLVED
        state.mastery_score = max(state.mastery_score, 0.9)
        state.misconception_id = None
    elif attempt.attempt_type == AttemptType.INITIAL:
        state.status = ConceptStatus.IMPROVING
        state.mastery_score = max(state.mastery_score, 0.55)

    state.evidence_count += 1
    state.last_attempt_id = attempt.id
    state.updated_at = datetime.now(timezone.utc)
    await session.flush()
    return state.status


async def _diagnose_attempt(session: AsyncSession, attempt: Attempt) -> DiagnosisEnvelope:
    existing = await session.scalar(select(Diagnosis).where(Diagnosis.attempt_id == attempt.id))
    if existing is not None:
        return await _diagnosis_envelope(session, attempt, existing)

    exercise = await session.get(Exercise, attempt.exercise_id)
    if exercise is None:
        raise _not_found("exercise", attempt.exercise_id)
    prediction = await provider.diagnose(
        AttemptForDiagnosis(
            exercise_id=exercise.id,
            prompt=exercise.prompt,
            submitted_code=attempt.submitted_code,
            test_results=attempt.test_results,
            learner_explanation=attempt.learner_explanation,
        )
    )
    misconception = await session.scalar(select(Misconception).where(Misconception.code == prediction.misconception_code.value))
    model_version = await session.scalar(select(ModelVersion).where(ModelVersion.name == prediction.model_version))
    if misconception is None or model_version is None:
        raise HTTPException(status_code=503, detail={"code": "DIAGNOSIS_CATALOG_NOT_READY", "message": "Seed the diagnosis catalog before requesting inference."})

    diagnosis = Diagnosis(
        id=f"diagnosis-{uuid4().hex}", attempt_id=attempt.id, misconception_id=misconception.id,
        model_version_id=model_version.id, confidence=prediction.confidence,
        class_probabilities={key.value: value for key, value in prediction.class_probabilities.items()},
        evidence=[item.model_dump(mode="json", by_alias=True, exclude_none=True) for item in prediction.evidence],
    )
    session.add(diagnosis)
    await session.flush()
    await _apply_concept_evidence(session, attempt, exercise, prediction, misconception)
    envelope = await _diagnosis_envelope(session, attempt, diagnosis)
    await session.commit()
    return envelope


async def _quest_is_eligible(session: AsyncSession, learner_id: str, quest: Quest) -> bool:
    required_count = int(quest.requirements.get("count", 1))
    if quest.quest_type == "COMPLETE_LESSON":
        concept_code = quest.requirements.get("conceptCode")
        completed = await session.scalar(
            select(LearnerConceptState).join(Concept).where(
                LearnerConceptState.learner_id == learner_id,
                Concept.code == concept_code,
                LearnerConceptState.evidence_count >= required_count,
            )
        )
        return completed is not None
    if quest.quest_type == "COMPLETE_INTERVENTION":
        intervention_type = quest.requirements.get("interventionType")
        completed = await session.scalar(
            select(Intervention)
            .join(Diagnosis, Diagnosis.id == Intervention.diagnosis_id)
            .join(Attempt, Attempt.id == Diagnosis.attempt_id)
            .where(
                Attempt.learner_id == learner_id,
                Intervention.intervention_type == intervention_type,
                Intervention.completed_at.is_not(None),
            )
        )
        return completed is not None
    if quest.quest_type == "COMPLETE_REASSESSMENT":
        exercise_type = quest.requirements.get("exerciseType")
        completed = await session.scalar(
            select(Attempt).join(Exercise).where(
                Attempt.learner_id == learner_id,
                Exercise.exercise_type == exercise_type,
            )
        )
        return completed is not None
    return False


@router.get("/learning-plan", response_model=LearningPlanRead)
async def learning_plan(
    learner_id: str | None = Query(default=None, alias="learnerId"),
    session: AsyncSession = Depends(get_session),
) -> LearningPlanRead:
    learner_id = session.info["learner_id"]
    learner = await session.get(Learner, learner_id)
    if learner is None:
        raise _not_found("learner", learner_id)
    concepts = list((await session.scalars(select(Concept).order_by(Concept.display_order))).all())
    states = list((await session.scalars(select(LearnerConceptState).where(LearnerConceptState.learner_id == learner_id))).all())
    state_by_concept = {item.concept_id: item for item in states}
    quest_rows = (await session.execute(
        select(Quest, LearnerQuest).join(LearnerQuest, LearnerQuest.quest_id == Quest.id).where(LearnerQuest.learner_id == learner_id)
    )).all()
    modules: list[LearningModuleRead] = []
    for concept in concepts:
        concept_state = state_by_concept.get(concept.id)
        modules.append(
            LearningModuleRead(
                id=concept.id,
                concept_code=concept.code,
                title=concept.name,
                description=concept.description,
                status=concept_state.status if concept_state else ConceptStatus.UNTESTED,
                progress=round(concept_state.mastery_score * 100) if concept_state else 0,
                display_order=concept.display_order,
            )
        )
    mastered = sum(item.status == ConceptStatus.RESOLVED for item in states)
    in_progress = sum(item.status in {ConceptStatus.NEEDS_PRACTICE, ConceptStatus.IMPROVING} for item in states)
    return LearningPlanRead(
        learner=LearnerRead(id=learner.id, name=learner.display_name, avatar=learner.avatar, xp=learner.xp, streak=learner.streak, level=learner.xp // 500 + 1),
        modules=modules,
        quests=[_quest_read(quest, learner_quest) for quest, learner_quest in quest_rows],
        statistics=LearningStatistics(total_concepts=len(concepts), mastered=mastered, in_progress=in_progress),
    )


@router.get("/exercises/{exercise_id}", response_model=ExerciseRead)
async def get_exercise(exercise_id: str, session: AsyncSession = Depends(get_session)) -> ExerciseRead:
    exercise = await session.get(Exercise, exercise_id)
    if exercise is None:
        raise _not_found("exercise", exercise_id)
    return ExerciseRead.model_validate(exercise)


@router.post("/attempts", response_model=AttemptRead, status_code=status.HTTP_201_CREATED)
async def create_attempt(payload: AttemptCreate, session: AsyncSession = Depends(get_session)) -> AttemptRead:
    if await session.get(Learner, payload.learner_id) is None:
        raise _not_found("learner", payload.learner_id)
    if await session.get(Exercise, payload.exercise_id) is None:
        raise _not_found("exercise", payload.exercise_id)
    if payload.parent_attempt_id and await session.get(Attempt, payload.parent_attempt_id) is None:
        raise _not_found("parent attempt", payload.parent_attempt_id)
    attempt = Attempt(id=f"attempt-{uuid4().hex}", **payload.model_dump(exclude={"test_results"}), test_results=payload.test_results.model_dump(mode="json"))
    session.add(attempt)
    await session.commit()
    await session.refresh(attempt)
    return _attempt_read(attempt)


@router.post("/attempts/{attempt_id}/diagnose", response_model=DiagnosisEnvelope)
async def diagnose_attempt(attempt_id: str, session: AsyncSession = Depends(get_session)) -> DiagnosisEnvelope:
    return await _diagnose_attempt(session, await _get_attempt(session, attempt_id))


@router.post("/attempts/{attempt_id}/code-review", response_model=CodeReviewRead)
async def review_attempt(attempt_id: str, session: AsyncSession = Depends(get_session)) -> CodeReviewRead:
    attempt = await _get_attempt(session, attempt_id)
    exercise = await session.get(Exercise, attempt.exercise_id)
    if exercise is None:
        raise _not_found("exercise", attempt.exercise_id)
    envelope = await _diagnose_attempt(session, attempt)
    prediction = DiagnosisPrediction(
        misconception_code=envelope.diagnosis.misconception_code,
        learner_friendly_name=envelope.diagnosis.learner_friendly_name,
        confidence=envelope.diagnosis.confidence,
        class_probabilities={MisconceptionCode(key): value for key, value in envelope.diagnosis.class_probabilities.items()},
        evidence=envelope.diagnosis.evidence,
        model_version=envelope.diagnosis.model_version,
    )
    normalized = AttemptForDiagnosis(
        exercise_id=exercise.id, prompt=exercise.prompt, submitted_code=attempt.submitted_code,
        test_results=attempt.test_results, learner_explanation=attempt.learner_explanation,
    )
    return await _review_normalized(normalized, prediction)


@router.post("/code-review", response_model=CodeReviewRead)
async def review_unsaved_attempt(payload: CodeReviewCreate) -> CodeReviewRead:
    """Review curriculum challenges that have no persisted exercise row yet."""
    normalized = AttemptForDiagnosis(
        exercise_id=payload.exercise_id, prompt=payload.prompt,
        submitted_code=payload.submitted_code,
        test_results=payload.test_results.model_dump(mode="json"),
        learner_explanation=payload.learner_explanation,
    )
    return await _review_normalized(normalized)


@router.get("/diagnoses/{diagnosis_id}", response_model=DiagnosisEnvelope)
async def get_diagnosis(diagnosis_id: str, session: AsyncSession = Depends(get_session)) -> DiagnosisEnvelope:
    diagnosis = await session.get(Diagnosis, diagnosis_id)
    if diagnosis is None:
        raise _not_found("diagnosis", diagnosis_id)
    return await _diagnosis_envelope(session, await _get_attempt(session, diagnosis.attempt_id), diagnosis)


@router.post("/diagnoses/{diagnosis_id}/intervention", response_model=InterventionRead)
async def select_intervention(diagnosis_id: str, session: AsyncSession = Depends(get_session)) -> InterventionRead:
    diagnosis = await session.get(Diagnosis, diagnosis_id)
    if diagnosis is None:
        raise _not_found("diagnosis", diagnosis_id)
    misconception = await session.get(Misconception, diagnosis.misconception_id)
    if misconception is None:
        raise HTTPException(status_code=500, detail={"code": "MISCONCEPTION_REFERENCE_MISSING", "message": "Stored misconception is unavailable."})
    intervention = await _intervention_for_diagnosis(session, diagnosis, misconception)
    await session.commit()
    return _intervention_read(intervention)


@router.post("/interventions/{intervention_id}/complete", response_model=InterventionCompletion)
async def complete_intervention(intervention_id: str, payload: InterventionComplete, session: AsyncSession = Depends(get_session)) -> InterventionCompletion:
    intervention = await _get_intervention(session, intervention_id)
    if await session.get(Learner, payload.learner_id) is None:
        raise _not_found("learner", payload.learner_id)
    if intervention.completed_at is None:
        intervention.completed_at = datetime.now(timezone.utc)
    await session.commit()
    return InterventionCompletion(
        intervention_id=intervention.id, completed=True, completed_at=intervention.completed_at,
        near_transfer_exercise_id=intervention.content.get("nearTransferExerciseId"),
        far_transfer_exercise_id=intervention.content.get("farTransferExerciseId"),
    )


@router.post("/reassessments", response_model=DiagnosisEnvelope, status_code=status.HTTP_201_CREATED)
async def create_reassessment(payload: ReassessmentCreate, session: AsyncSession = Depends(get_session)) -> DiagnosisEnvelope:
    if payload.attempt_type not in {AttemptType.NEAR_TRANSFER, AttemptType.FAR_TRANSFER}:
        raise HTTPException(status_code=422, detail={"code": "INVALID_REASSESSMENT_TYPE", "message": "Reassessment must be NEAR_TRANSFER or FAR_TRANSFER."})
    intervention = await _get_intervention(session, payload.intervention_id)
    if intervention.completed_at is None:
        raise HTTPException(status_code=409, detail={"code": "INTERVENTION_NOT_COMPLETE", "message": "Complete the intervention before reassessment."})
    attempt_payload = AttemptCreate.model_validate(payload.model_dump(exclude={"intervention_id"}))
    attempt_read = await create_attempt(attempt_payload, session)
    return await _diagnose_attempt(session, await _get_attempt(session, attempt_read.id))


@router.get("/learners/{learner_id}/progress", response_model=ProgressRead)
async def learner_progress(learner_id: str, session: AsyncSession = Depends(get_session)) -> ProgressRead:
    if await session.get(Learner, learner_id) is None:
        raise _not_found("learner", learner_id)
    rows = (await session.execute(
        select(LearnerConceptState, Concept, Misconception)
        .join(Concept, Concept.id == LearnerConceptState.concept_id)
        .outerjoin(Misconception, Misconception.id == LearnerConceptState.misconception_id)
        .where(LearnerConceptState.learner_id == learner_id).order_by(Concept.display_order)
    )).all()
    return ProgressRead(learner_id=learner_id, concepts=[
        ConceptProgress(
            concept_id=concept.id, concept=concept.name, status=state.status, mastery_score=state.mastery_score,
            evidence_count=state.evidence_count, last_misconception_code=misconception.code if misconception else None,
            updated_at=state.updated_at,
        ) for state, concept, misconception in rows
    ])


@router.get("/learners/{learner_id}/quests", response_model=list[QuestRead])
async def learner_quests(learner_id: str, session: AsyncSession = Depends(get_session)) -> list[QuestRead]:
    if await session.get(Learner, learner_id) is None:
        raise _not_found("learner", learner_id)
    rows = (await session.execute(
        select(Quest, LearnerQuest).join(LearnerQuest, LearnerQuest.quest_id == Quest.id).where(LearnerQuest.learner_id == learner_id)
    )).all()
    return [_quest_read(quest, learner_quest) for quest, learner_quest in rows]


@router.post("/quests/{quest_id}/complete", response_model=QuestCompletion)
async def complete_quest(quest_id: str, payload: QuestComplete, session: AsyncSession = Depends(get_session)) -> QuestCompletion:
    learner = await session.get(Learner, payload.learner_id)
    quest = await session.get(Quest, quest_id)
    learner_quest = await session.get(LearnerQuest, (payload.learner_id, quest_id))
    if learner is None:
        raise _not_found("learner", payload.learner_id)
    if quest is None or learner_quest is None:
        raise _not_found("quest", quest_id)
    awarded = 0
    if learner_quest.status != QuestStatus.COMPLETED:
        if not await _quest_is_eligible(session, payload.learner_id, quest):
            raise HTTPException(status_code=409, detail={"code": "QUEST_NOT_ELIGIBLE", "message": "Complete the quest requirement before claiming its reward."})
        learner_quest.status = QuestStatus.COMPLETED
        learner_quest.progress = max(1, learner_quest.progress)
        learner_quest.completed_at = datetime.now(timezone.utc)
        learner.xp += quest.xp_reward
        awarded = quest.xp_reward
    await session.commit()
    return QuestCompletion(quest=_quest_read(quest, learner_quest), learner_xp=learner.xp, xp_awarded=awarded)


@router.get("/model/metrics", response_model=ModelMetricsRead)
async def model_metrics(session: AsyncSession = Depends(get_session)) -> ModelMetricsRead:
    model = await session.scalar(select(ModelVersion).order_by(ModelVersion.created_at.desc()))
    if model is None:
        raise HTTPException(status_code=503, detail={"code": "MODEL_NOT_READY", "message": "No active model version is registered."})
    return ModelMetricsRead.model_validate(model)
