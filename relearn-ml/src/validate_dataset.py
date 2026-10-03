"""Validate Re:Learn JSONL records without third-party dependencies."""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SPLIT_PATH = ROOT / "data" / "splits" / "family_split.json"

LABELS = {
    "CORRECT",
    "RANGE_ENDPOINT_EXCLUDED",
    "WRONG_INITIALIZATION",
    "ACCUMULATOR_OVERWRITTEN",
    "WRONG_OR_MISSING_UPDATE",
    "VARIABLE_ROLE_CONFUSION",
}
SPLITS = {"train", "validation", "test"}
STATUSES = {"PENDING", "NEEDS_SECOND_REVIEW", "APPROVED", "REJECTED"}
REQUIRED = {
    "sampleId",
    "problemId",
    "problemFamily",
    "split",
    "prompt",
    "submittedCode",
    "testCases",
    "testResults",
    "label",
    "source",
    "reviewStatus",
    "reviewedBy",
    "reviewerNote",
    "intendedFailure",
}


def load_split_lookup() -> dict[str, str]:
    with SPLIT_PATH.open("r", encoding="utf-8") as handle:
        config: dict[str, list[str]] = json.load(handle)
    result: dict[str, str] = {}
    for split, families in config.items():
        if split not in SPLITS:
            raise ValueError(f"Unknown split {split!r} in split configuration")
        for family in families:
            if family in result:
                raise ValueError(f"Family {family!r} is assigned more than once")
            result[family] = split
    return result


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            if not line.strip():
                continue
            try:
                value = json.loads(line)
            except json.JSONDecodeError as error:
                raise ValueError(f"Line {line_number}: invalid JSON: {error}") from error
            if not isinstance(value, dict):
                raise ValueError(f"Line {line_number}: record must be an object")
            value["__line__"] = line_number
            records.append(value)
    return records


def validate_record(
    record: dict[str, Any],
    family_splits: dict[str, str],
    allow_pending: bool,
) -> list[str]:
    line = record["__line__"]
    errors: list[str] = []
    missing = REQUIRED - record.keys()
    if missing:
        errors.append(f"line {line}: missing fields {sorted(missing)}")
        return errors

    if record["label"] not in LABELS:
        errors.append(f"line {line}: unsupported label {record['label']!r}")
    if record["split"] not in SPLITS:
        errors.append(f"line {line}: unsupported split {record['split']!r}")
    if record["reviewStatus"] not in STATUSES:
        errors.append(f"line {line}: unsupported review status {record['reviewStatus']!r}")
    if not isinstance(record["testCases"], list) or len(record["testCases"]) < 2:
        errors.append(f"line {line}: at least two test cases are required")

    expected_split = family_splits.get(record["problemFamily"])
    if expected_split is None:
        errors.append(f"line {line}: family {record['problemFamily']!r} has no split assignment")
    elif expected_split != record["split"]:
        errors.append(
            f"line {line}: family {record['problemFamily']!r} must be in {expected_split!r}"
        )

    if not allow_pending:
        if record["reviewStatus"] != "APPROVED":
            errors.append(f"line {line}: training data must be APPROVED")
        if not record["reviewedBy"]:
            errors.append(f"line {line}: approved data requires a reviewer")
        if record["testResults"] is None:
            errors.append(f"line {line}: approved data requires executed test results")
        if not record["reviewerNote"]:
            errors.append(f"line {line}: approved data requires a reviewer note")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset", type=Path)
    parser.add_argument(
        "--allow-pending",
        action="store_true",
        help="Allow unreviewed candidate records. Never use this for training inputs.",
    )
    args = parser.parse_args()

    path = args.dataset if args.dataset.is_absolute() else ROOT / args.dataset
    records = read_jsonl(path)
    family_splits = load_split_lookup()
    errors: list[str] = []
    seen_ids: set[str] = set()
    splits_by_family: dict[str, set[str]] = defaultdict(set)

    for record in records:
        errors.extend(validate_record(record, family_splits, args.allow_pending))
        sample_id = record.get("sampleId")
        if sample_id in seen_ids:
            errors.append(f"line {record['__line__']}: duplicate sampleId {sample_id!r}")
        seen_ids.add(sample_id)
        if "problemFamily" in record and "split" in record:
            splits_by_family[record["problemFamily"]].add(record["split"])

    for family, splits in splits_by_family.items():
        if len(splits) > 1:
            errors.append(f"family {family!r} leaks across splits: {sorted(splits)}")

    if errors:
        print(f"Validation failed with {len(errors)} error(s):")
        for error in errors:
            print(f"  - {error}")
        return 1

    label_counts = Counter(record["label"] for record in records)
    split_counts = Counter(record["split"] for record in records)
    print(f"Validated {len(records)} records from {path.relative_to(ROOT)}")
    print("Labels:", dict(sorted(label_counts.items())))
    print("Splits:", dict(sorted(split_counts.items())))
    print("Mode:", "candidate review" if args.allow_pending else "strict training data")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
