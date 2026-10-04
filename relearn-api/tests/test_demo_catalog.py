from app.models.enums import ExerciseType
from app.schemas.diagnoses import MisconceptionCode
from app.seed.demo_data import EXERCISES, INTERVENTION_CONTENT_BY_CODE, MISCONCEPTIONS


def test_demo_catalog_covers_every_diagnosis_code() -> None:
    seeded_codes = {item.code for item in MISCONCEPTIONS}
    assert seeded_codes == {code.value for code in MisconceptionCode}


def test_boundary_intervention_references_both_transfer_exercises() -> None:
    exercise_types = {exercise.id: exercise.exercise_type for exercise in EXERCISES}
    content = INTERVENTION_CONTENT_BY_CODE[MisconceptionCode.RANGE_ENDPOINT_EXCLUDED]

    assert exercise_types[content["nearTransferExerciseId"]] == ExerciseType.NEAR_TRANSFER
    assert exercise_types[content["farTransferExerciseId"]] == ExerciseType.FAR_TRANSFER


def test_demo_exercise_ids_are_unique() -> None:
    ids = [exercise.id for exercise in EXERCISES]
    assert len(ids) == len(set(ids))
