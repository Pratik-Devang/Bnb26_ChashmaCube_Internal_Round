from __future__ import annotations

import asyncio

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory, dispose_engine
from app.models.enums import ConceptStatus, ExerciseType, QuestStatus
from app.models.interventions import LearnerConceptState
from app.models.learning import Concept, Exercise, Misconception
from app.models.learner import Learner
from app.models.model_version import ModelVersion
from app.models.quests import LearnerQuest, Quest


CONCEPTS = [
    Concept(id="concept-variables", code="VARIABLES", name="Variables & values", description="Store and update information with clear names.", display_order=1),
    Concept(id="concept-conditions", code="CONDITIONS", name="Conditions", description="Choose which code should run based on a condition.", display_order=2),
    Concept(id="concept-loop-boundaries", code="LOOP_BOUNDARIES", name="Loop boundaries", description="Understand exactly where a loop starts and stops.", display_order=3),
    Concept(id="concept-accumulators", code="ACCUMULATORS", name="Accumulators", description="Build a total one step at a time.", display_order=4),
    Concept(id="concept-while-loops", code="WHILE_LOOPS", name="While loops", description="Repeat work while a condition remains true.", display_order=5),
    Concept(id="concept-loop-mastery", code="LOOP_MASTERY", name="Loop mastery", description="Transfer loop knowledge into unfamiliar problems.", display_order=6),
]

MISCONCEPTIONS = [
    Misconception(id="misconception-correct", code="CORRECT", learner_friendly_name="Ready for the next step", internal_description="No supported misconception is present.", intervention_type="NONE"),
    Misconception(id="misconception-range-endpoint", code="RANGE_ENDPOINT_EXCLUDED", learner_friendly_name="Boundary bug", internal_description="The required upper endpoint is excluded from iteration.", intervention_type="RANGE_PATH_GAME"),
    Misconception(id="misconception-wrong-initialization", code="WRONG_INITIALIZATION", learner_friendly_name="Starting-value mix-up", internal_description="The accumulator begins with an incorrect neutral value.", intervention_type="STARTING_VALUE_GAME"),
    Misconception(id="misconception-accumulator-overwritten", code="ACCUMULATOR_OVERWRITTEN", learner_friendly_name="Running-total reset", internal_description="The accumulator is replaced rather than updated.", intervention_type="RUNNING_TOTAL_GAME"),
    Misconception(id="misconception-wrong-update", code="WRONG_OR_MISSING_UPDATE", learner_friendly_name="Loop update missing", internal_description="The loop control state is missing or moves incorrectly.", intervention_type="LOOP_STATE_GAME"),
    Misconception(id="misconception-variable-role", code="VARIABLE_ROLE_CONFUSION", learner_friendly_name="Variable-role mix-up", internal_description="Input, iterator, accumulator, or result roles are confused.", intervention_type="VARIABLE_ROLE_GAME"),
    Misconception(id="misconception-uncertain", code="UNCERTAIN", learner_friendly_name="Let’s look a little closer", internal_description="Evidence is insufficient or conflicting.", intervention_type="GUIDED_REVIEW"),
]

EXERCISES = [
    Exercise(
        id="inclusive-sum-01",
        concept_id="concept-loop-boundaries",
        title="Add every number",
        prompt="Write inclusive_sum(n) so it returns the sum of every whole number from 1 through n.",
        difficulty="beginner",
        starter_code="def inclusive_sum(n):\n    total = 0\n    # Add your loop here\n    return total",
        test_cases=[
            {"args": [1], "expected": 1},
            {"args": [5], "expected": 15},
            {"args": [8], "expected": 36},
        ],
        exercise_type=ExerciseType.PRACTICE,
    ),
    Exercise(
        id="list-traversal-04",
        concept_id="concept-loop-boundaries",
        title="Visit every item",
        prompt="Write add_items(values) so it adds every number in the list, including the final item.",
        difficulty="beginner",
        starter_code="def add_items(values):\n    total = 0\n    # Visit every index\n    return total",
        test_cases=[
            {"args": [[4]], "expected": 4},
            {"args": [[2, 3, 5]], "expected": 10},
            {"args": [[1, 1, 1, 7]], "expected": 10},
        ],
        exercise_type=ExerciseType.NEAR_TRANSFER,
    ),
    Exercise(
        id="multiples-through-n-02",
        concept_id="concept-loop-boundaries",
        title="Count landing tiles",
        prompt="Write count_multiples(n, step) to count multiples of step from step through n, including n when it is a multiple.",
        difficulty="beginner",
        starter_code="def count_multiples(n, step):\n    count = 0\n    # Count every landing tile\n    return count",
        test_cases=[
            {"args": [6, 3], "expected": 2},
            {"args": [10, 2], "expected": 5},
            {"args": [9, 4], "expected": 2},
        ],
        exercise_type=ExerciseType.FAR_TRANSFER,
    ),
]

QUESTS = [
    Quest(id="quest-loop-lesson", title="Complete a loop lesson", description="Take one small step along your Python path.", xp_reward=60, quest_type="COMPLETE_LESSON", requirements={"conceptCode": "LOOP_BOUNDARIES", "count": 1}),
    Quest(id="quest-boundary-bug", title="Fix a boundary bug", description="Help Byte visit every required tile.", xp_reward=90, quest_type="COMPLETE_INTERVENTION", requirements={"interventionType": "RANGE_PATH_GAME", "count": 1}),
    Quest(id="quest-transfer", title="Beat the transfer challenge", description="Use the same idea in a brand-new question.", xp_reward=150, quest_type="COMPLETE_REASSESSMENT", requirements={"exerciseType": "FAR_TRANSFER", "count": 1}),
]

INTERVENTION_CONTENT_BY_CODE: dict[str, dict[str, object]] = {
    "RANGE_ENDPOINT_EXCLUDED": {
        "type": "RANGE_PATH_GAME",
        "title": "Help Byte reach the final tile",
        "estimatedMinutes": 2,
        "instructions": "Choose an endpoint that lets Byte visit every required tile.",
        "rounds": [
            {"start": 1, "requiredLastTile": 5, "choices": [5, 6, 7], "correctStop": 6},
            {"start": 2, "requiredLastTile": 8, "choices": [8, 9, 10], "correctStop": 9},
        ],
        "nearTransferExerciseId": "list-traversal-04",
        "farTransferExerciseId": "multiples-through-n-02",
    }
}


async def seed_demo_data(session: AsyncSession) -> None:
    await session.merge(Learner(id="learner-demo", display_name="Maya", avatar="👩🏽‍💻", xp=1280, streak=7))
    await session.merge(ModelVersion(id="model-rule-demo-v1", name="rule-based-demo-v1", dataset_version="not-applicable", artifact_path="builtin://rule-based-demo-v1", metrics={"kind": "deterministic-integration-provider"}))

    for concept in CONCEPTS:
        await session.merge(concept)
    for misconception in MISCONCEPTIONS:
        await session.merge(misconception)
    for exercise in EXERCISES:
        await session.merge(exercise)
    for quest in QUESTS:
        await session.merge(quest)

    for concept in CONCEPTS:
        await session.merge(
            LearnerConceptState(
                id=f"state-learner-demo-{concept.code.lower()}",
                learner_id="learner-demo",
                concept_id=concept.id,
                misconception_id=None,
                status=ConceptStatus.UNTESTED,
                evidence_count=0,
                mastery_score=0,
                last_attempt_id=None,
            )
        )
    for quest in QUESTS:
        await session.merge(
            LearnerQuest(
                learner_id="learner-demo",
                quest_id=quest.id,
                status=QuestStatus.OPEN,
                progress=0,
                completed_at=None,
            )
        )
    await session.commit()


async def main() -> None:
    async with async_session_factory() as session:
        await seed_demo_data(session)
    await dispose_engine()
    print("Seeded deterministic Re:Learn demo data.")


if __name__ == "__main__":
    asyncio.run(main())
