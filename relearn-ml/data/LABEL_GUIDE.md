# Misconception annotation guide

## Purpose

Assign the single misconception that best explains a learner’s reasoning and code. A label describes an underlying idea, not merely a failing output. Use the exercise prompt, source code, test behavior, AST evidence, and optional explanation together.

## Trainable labels

### `CORRECT`

The code satisfies the exercise semantics and all approved tests. Accept non-canonical solutions and different loop styles. Never require code to resemble the reference solution.

Include when:

- All representative and boundary tests pass.
- The implementation terminates within the execution limit.
- The result is correct despite unusual variable names or structure.

Exclude when tests are too weak to distinguish a coincidental answer.

### `RANGE_ENDPOINT_EXCLUDED`

The learner understands the loop’s purpose but excludes a required final element or endpoint.

Strong evidence:

- `range(1, n)` where the task requires values through `n`.
- `range(len(values) - 1)` where every list item is required.
- A loop condition such as `i < n` where `i <= n` is intended.
- Failures differ from expected output by exactly the missing final contribution.

Do not use when the learner chose the wrong variable entirely; consider `VARIABLE_ROLE_CONFUSION`.

### `WRONG_INITIALIZATION`

The learner selected the correct accumulation process but began from the wrong neutral or starting value.

Strong evidence:

- A sum or count begins at `1` instead of `0`.
- A product begins at `0` instead of `1`.
- The initial value creates a consistent offset across otherwise-correct tests.

Do not use when the accumulator is reset inside the loop; consider `ACCUMULATOR_OVERWRITTEN`.

### `ACCUMULATOR_OVERWRITTEN`

The learner replaces a running value instead of combining the current value with the new contribution.

Strong evidence:

- `total = i` instead of `total += i`.
- `product = i` instead of `product *= i`.
- Reinitializing the accumulator during each iteration.
- The final output resembles only the last processed contribution.

### `WRONG_OR_MISSING_UPDATE`

The learner understands that a `while` loop repeats but fails to move its control state toward termination.

Strong evidence:

- The condition variable is never updated.
- The update moves in the wrong direction.
- A different variable is updated while the condition remains unchanged.
- Execution reaches the configured timeout.

Do not execute these candidates without a subprocess or worker time limit.

### `VARIABLE_ROLE_CONFUSION`

The learner confuses the roles of the input, iterator, accumulator, or result.

Strong evidence:

- Adds `n` on every iteration instead of adding `i`.
- Returns the iterator instead of the accumulator.
- Mutates the input when intending to update the result.
- Uses an accumulator as a loop bound without conceptual justification.

## Inference-only outcome: `UNCERTAIN`

`UNCERTAIN` is not a normal training label in the first baseline. Return it when:

- Code cannot be parsed or safely evaluated.
- Two misconceptions have comparable evidence.
- Maximum calibrated probability is below the confidence threshold.
- The top-two probability margin is below the ambiguity threshold.
- The response is outside the six-class ontology.

## Review policy

Every training record must have:

- At least one reviewer identifier.
- Executed test results from the approved safe runner.
- `reviewStatus: "APPROVED"`.
- Exactly one trainable label.
- A problem-family split matching `data/splits/family_split.json`.
- A short reviewer note explaining decisive evidence.

Use `REJECTED` when a generated mutation does not express its intended misconception. Use `NEEDS_SECOND_REVIEW` when evidence is ambiguous.

## Leakage rules

- Group every derivative of the same exercise under one `problemFamily`.
- Never place related variants in different splits.
- Do not tune thresholds or features using the final test families.
- Do not duplicate formatting-only changes as independent evidence.
- Keep source and license metadata for imported examples.
