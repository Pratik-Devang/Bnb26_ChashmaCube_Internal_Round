# Re:Learn misconception model

This directory contains the dataset and training pipeline for the introductory-Python misconception classifier. Batch 1 establishes the annotation contract and produces balanced **candidate** examples. It does not claim that generated examples are reviewed training data.

## Batch 1 workflow

```powershell
cd relearn-ml
python src/build_seed_candidates.py
python src/validate_dataset.py data/candidates/seed_candidates.jsonl --allow-pending
```

Then review each record against `data/LABEL_GUIDE.md`:

1. Run the submitted function against every predefined test in an isolated runner.
2. Confirm that the observed behavior matches `intendedFailure`.
3. Confirm one misconception is the clearest explanation.
4. Set `reviewStatus` to `APPROVED`, add reviewer identifiers, and record test results.
5. Copy only approved records into `data/reviewed/reviewed_examples.jsonl`.

Training code must consume only `data/reviewed/`. It must group by `problemFamily` using `data/splits/family_split.json`; variants from one family must never cross splits.

## Current scope

- Six trainable labels plus the inference-only `UNCERTAIN` outcome.
- Ten seed problem families and sixty balanced candidate records.
- JSON Schema and a standard-library validation command.
- Fixed family-level train, validation, and test assignments.

The next batch adds safe test execution, AST/test-signature extraction, and the first reviewed examples. The baseline classifier follows only after review.
