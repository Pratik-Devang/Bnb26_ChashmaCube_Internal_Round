# Misconception model training plan

## Batch sequence

1. **Annotation contract:** freeze labels, exclusions, dataset schema, problem-family grouping, and review rules.
2. **Evidence pipeline:** execute approved tests in isolated subprocesses, enforce time limits, and extract AST/test features.
3. **Human review:** approve or reject synthetic candidates and import licensed McMiner/MBPP examples with provenance.
4. **Baseline:** character and token TF-IDF plus AST/test features feeding multinomial logistic regression.
5. **Calibration:** tune probability and top-two-margin thresholds on validation families; emit `UNCERTAIN` when evidence is weak.
6. **Evaluation:** macro-F1, per-class metrics, confusion matrix, log loss, calibration, coverage, and accepted-prediction accuracy on untouched test families.
7. **Artifact:** save the entire preprocessing/classification pipeline with dataset version, thresholds, metrics, and label map.

## Batch 1 acceptance criteria

- Six labels have positive and negative decision rules.
- Ambiguous or unparsable responses have an `UNCERTAIN` policy.
- Candidate and reviewed data are physically separated.
- Generated records cannot pass strict validation as training data.
- Every derived example inherits one immutable family-level split.
- Class counts are balanced in the candidate set.
- No validation or test family appears in training.

## Baseline feature contract

The later training matrix will combine:

- Character TF-IDF over submitted code.
- Token TF-IDF over prompt, code, and optional learner explanation.
- AST counts and role features: loop types, `range` arguments, assignment operators, initialization location, read/write sets, and condition-variable updates.
- Test signatures: pass/fail vector, timeout flag, numeric delta pattern, unchanged output, and last-contribution behavior.

Structured learner-facing evidence is produced by deterministic feature rules. Model probabilities choose or abstain from a class; generated prose never decides the diagnosis.
