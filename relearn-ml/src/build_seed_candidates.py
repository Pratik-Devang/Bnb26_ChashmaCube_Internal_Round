"""Build balanced, unreviewed seed candidates for human annotation.

The generated records are intentionally marked PENDING and have no test results.
They must never be used for model training until the review workflow approves them.
"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "problem_catalog.json"
SPLIT_PATH = ROOT / "data" / "splits" / "family_split.json"
OUTPUT_PATH = ROOT / "data" / "candidates" / "seed_candidates.jsonl"

LABELS = (
    "CORRECT",
    "RANGE_ENDPOINT_EXCLUDED",
    "WRONG_INITIALIZATION",
    "ACCUMULATOR_OVERWRITTEN",
    "WRONG_OR_MISSING_UPDATE",
    "VARIABLE_ROLE_CONFUSION",
)


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def split_lookup(split_config: dict[str, list[str]]) -> dict[str, str]:
    result: dict[str, str] = {}
    for split, families in split_config.items():
        for family in families:
            if family in result:
                raise ValueError(f"Problem family {family!r} appears in more than one split")
            result[family] = split
    return result


def update_statement(spec: dict[str, Any], expression: str | None = None) -> str:
    term = expression or spec["termExpression"]
    if spec["operation"] == "product":
        return f"result *= {term}"
    return f"result += {term}"


def code_for_label(spec: dict[str, Any], label: str) -> str:
    name = spec["functionName"]
    neutral = spec["neutralValue"]
    wrong_initial = spec["wrongInitialValue"]
    update = update_statement(spec)
    confused_update = update_statement(spec, "n")

    if label == "CORRECT":
        return (
            f"def {name}(n):\n"
            f"    result = {neutral}\n"
            "    for i in range(1, n + 1):\n"
            f"        {update}\n"
            "    return result"
        )
    if label == "RANGE_ENDPOINT_EXCLUDED":
        return (
            f"def {name}(n):\n"
            f"    result = {neutral}\n"
            "    for i in range(1, n):\n"
            f"        {update}\n"
            "    return result"
        )
    if label == "WRONG_INITIALIZATION":
        return (
            f"def {name}(n):\n"
            f"    result = {wrong_initial}\n"
            "    for i in range(1, n + 1):\n"
            f"        {update}\n"
            "    return result"
        )
    if label == "ACCUMULATOR_OVERWRITTEN":
        return (
            f"def {name}(n):\n"
            f"    result = {neutral}\n"
            "    for i in range(1, n + 1):\n"
            f"        result = {spec['termExpression']}\n"
            "    return result"
        )
    if label == "WRONG_OR_MISSING_UPDATE":
        return (
            f"def {name}(n):\n"
            f"    result = {neutral}\n"
            "    i = 1\n"
            "    while i <= n:\n"
            f"        {update}\n"
            "    return result"
        )
    if label == "VARIABLE_ROLE_CONFUSION":
        return (
            f"def {name}(n):\n"
            f"    result = {neutral}\n"
            "    for i in range(1, n + 1):\n"
            f"        {confused_update}\n"
            "    return result"
        )
    raise ValueError(f"Unsupported label: {label}")


def explanation_for_label(label: str) -> str:
    return {
        "CORRECT": "I started from the neutral value and included every required step.",
        "RANGE_ENDPOINT_EXCLUDED": "I thought range would include the ending value.",
        "WRONG_INITIALIZATION": "I chose a starting value before adding or multiplying the terms.",
        "ACCUMULATOR_OVERWRITTEN": "I stored the current term in result on each loop.",
        "WRONG_OR_MISSING_UPDATE": "The while condition will eventually finish the loop.",
        "VARIABLE_ROLE_CONFUSION": "I used n because it is the number given to the function.",
    }[label]


def intended_failure(label: str) -> str:
    return {
        "CORRECT": "All approved tests should pass.",
        "RANGE_ENDPOINT_EXCLUDED": "The final required contribution is absent.",
        "WRONG_INITIALIZATION": "Outputs have a consistent offset or incorrect product neutral value.",
        "ACCUMULATOR_OVERWRITTEN": "The result resembles only the final contribution.",
        "WRONG_OR_MISSING_UPDATE": "Execution exceeds the configured time limit because i is unchanged.",
        "VARIABLE_ROLE_CONFUSION": "The input n is repeatedly accumulated where iterator i is required.",
    }[label]


def build_records() -> list[dict[str, Any]]:
    catalog = load_json(CATALOG_PATH)
    family_splits = split_lookup(load_json(SPLIT_PATH))
    records: list[dict[str, Any]] = []

    for spec in catalog:
        family = spec["problemFamily"]
        if family not in family_splits:
            raise ValueError(f"Missing split assignment for {family!r}")
        for label in LABELS:
            records.append(
                {
                    "sampleId": f"{spec['problemId']}-{label.lower().replace('_', '-')}",
                    "problemId": spec["problemId"],
                    "problemFamily": family,
                    "split": family_splits[family],
                    "prompt": spec["prompt"],
                    "submittedCode": code_for_label(spec, label),
                    "learnerExplanation": explanation_for_label(label),
                    "testCases": spec["testCases"],
                    "testResults": None,
                    "label": label,
                    "source": "synthetic-candidate",
                    "sourceReference": None,
                    "reviewStatus": "PENDING",
                    "reviewedBy": [],
                    "reviewerNote": None,
                    "intendedFailure": intended_failure(label),
                }
            )
    return records


def main() -> None:
    records = build_records()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8", newline="\n") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")

    counts = Counter(record["label"] for record in records)
    print(f"Wrote {len(records)} pending candidates to {OUTPUT_PATH.relative_to(ROOT)}")
    for label in LABELS:
        print(f"  {label}: {counts[label]}")


if __name__ == "__main__":
    main()
