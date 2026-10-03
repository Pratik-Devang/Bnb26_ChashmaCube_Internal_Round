from enum import StrEnum


class ExerciseType(StrEnum):
    PRACTICE = "PRACTICE"
    NEAR_TRANSFER = "NEAR_TRANSFER"
    FAR_TRANSFER = "FAR_TRANSFER"


class AttemptType(StrEnum):
    INITIAL = "INITIAL"
    NEAR_TRANSFER = "NEAR_TRANSFER"
    FAR_TRANSFER = "FAR_TRANSFER"


class ConceptStatus(StrEnum):
    UNTESTED = "UNTESTED"
    NEEDS_PRACTICE = "NEEDS_PRACTICE"
    IMPROVING = "IMPROVING"
    RESOLVED = "RESOLVED"


class QuestStatus(StrEnum):
    OPEN = "OPEN"
    COMPLETED = "COMPLETED"
