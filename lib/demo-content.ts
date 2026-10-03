import type { Exercise, Misconception } from "@/types/learning";

export interface MisconceptionDefinition {
  code: Exclude<Misconception, "CORRECT" | "UNCERTAIN">;
  displayName: string;
  description: string;
  intervention: { type: string; title: string; estimatedMinutes: number; instructions: string[] };
  nearTransferId: string;
  farTransferId: string;
}

const exercise = (
  id: string, conceptId: string, title: string, prompt: string, starterCode: string,
  testCases: Exercise["testCases"], exerciseType: Exercise["exerciseType"],
  hint: string, expectedMisconception?: Misconception,
): Exercise & { friendlyHint: string; expectedMisconception?: Misconception } => ({
  id, conceptId, title, prompt, starterCode, testCases, exerciseType,
  difficulty: "beginner", friendlyHint: hint, expectedMisconception,
});

export const demoExercises = [
  exercise("inclusive-sum-01", "loop-boundaries", "Add every number", "Write inclusive_sum(n) to sum every whole number from 1 through n, including n.", "def inclusive_sum(n):\n    total = 0\n    # Write your loop here\n    return total", [{ input: { n: 5 }, expected: 15 }, { input: { n: 3 }, expected: 6 }, { input: { n: 1 }, expected: 1 }], "practice", "Python stops before range's second number. What stop value lets the loop visit n?", "RANGE_ENDPOINT_EXCLUDED"),
  exercise("count-even-01", "accumulators", "Count the even numbers", "Write count_evens(numbers) to return how many values in the list are even.", "def count_evens(numbers):\n    count = 0\n    for number in numbers:\n        # Update count when appropriate\n        pass\n    return count", [{ input: { numbers: [2, 5, 8, 9] }, expected: 2 }, { input: { numbers: [1, 3] }, expected: 0 }, { input: { numbers: [] }, expected: 0 }], "practice", "Before checking any numbers, how many matches have you found?", "WRONG_INITIALIZATION"),
  exercise("sum-squares-01", "accumulators", "Add the squares", "Write sum_squares(numbers) to return the sum of each number squared.", "def sum_squares(numbers):\n    total = 0\n    for number in numbers:\n        # Add this number's square\n        pass\n    return total", [{ input: { numbers: [2, 3] }, expected: 13 }, { input: { numbers: [4] }, expected: 16 }, { input: { numbers: [] }, expected: 0 }], "practice", "Keep the earlier total, then add the new square to it.", "ACCUMULATOR_OVERWRITTEN"),
  exercise("countdown-01", "while-loops", "Count down to zero", "Write countdown_total(start) to sum start down to 1; return zero when start is zero.", "def countdown_total(start):\n    total = 0\n    current = start\n    while current > 0:\n        total += current\n        # Move toward the stopping condition\n    return total", [{ input: { start: 4 }, expected: 10 }, { input: { start: 1 }, expected: 1 }, { input: { start: 0 }, expected: 0 }], "practice", "After adding current, change it so it can eventually reach zero.", "WRONG_OR_MISSING_UPDATE"),
  exercise("find-longest-01", "loop-mastery", "Find the longest word", "Return the first longest word in a nonempty list.", "def longest_word(words):\n    longest = words[0]\n    for word in words:\n        # Compare with the best so far\n        pass\n    return longest", [{ input: { words: ["sun", "planet", "moon"] }, expected: "planet" }, { input: { words: ["red", "blue"] }, expected: "blue" }, { input: { words: ["first"] }, expected: "first" }], "practice", "word is the candidate now; longest remembers the best candidate so far.", "VARIABLE_ROLE_CONFUSION"),
  exercise("range-labels-01", "loop-boundaries", "Label the steps", "Return labels step 1 through step n, in order.", "def step_labels(n):\n    labels = []\n    for step in range(1, n + 1):\n        # Add this step's label\n        pass\n    return labels", [{ input: { n: 3 }, expected: ["step 1", "step 2", "step 3"] }, { input: { n: 1 }, expected: ["step 1"] }, { input: { n: 0 }, expected: [] }], "practice", "Check the first and last visited values, then add one label each turn.", "RANGE_ENDPOINT_EXCLUDED"),
  exercise("list-multiples-near", "loop-boundaries", "List the multiples", "Return multiples of 3 from 3 through limit, including limit when divisible.", "def multiples(limit):\n    result = []\n    # Add each multiple of 3\n    return result", [{ input: { limit: 9 }, expected: [3, 6, 9] }, { input: { limit: 7 }, expected: [3, 6] }, { input: { limit: 2 }, expected: [] }], "near-transfer", "The last valid value may equal limit. Choose a stop that can include it.", "RANGE_ENDPOINT_EXCLUDED"),
  exercise("days-in-month-far", "loop-boundaries", "List the calendar days", "Return day numbers from 1 through days, inclusive.", "def calendar_days(days):\n    result = []\n    # Build the day numbers\n    return result", [{ input: { days: 4 }, expected: [1, 2, 3, 4] }, { input: { days: 1 }, expected: [1] }], "far-transfer", "A month with days days has a final day numbered days.", "RANGE_ENDPOINT_EXCLUDED"),
  exercise("count-long-words-near", "accumulators", "Count long words", "Count words whose length is greater than threshold.", "def count_long_words(words, threshold):\n    count = 0\n    for word in words:\n        # Count matching words\n        pass\n    return count", [{ input: { words: ["sun", "planet"], threshold: 3 }, expected: 1 }, { input: { words: ["a", "bb"], threshold: 3 }, expected: 0 }], "near-transfer", "A count starts at the number of matches found before the loop.", "WRONG_INITIALIZATION"),
  exercise("inventory-total-far", "accumulators", "Total the inventory", "Sum price times quantity for each item record.", "def inventory_total(items):\n    total = 0\n    for item in items:\n        # Add this item's value\n        pass\n    return total", [{ input: { items: [{ price: 4, quantity: 2 }] }, expected: 8 }, { input: { items: [] }, expected: 0 }], "far-transfer", "Before processing any items, the amount collected is zero.", "WRONG_INITIALIZATION"),
  exercise("sum-lengths-near", "accumulators", "Add the word lengths", "Return the total length of all words.", "def sum_lengths(words):\n    total = 0\n    for word in words:\n        # Add this word's length\n        pass\n    return total", [{ input: { words: ["cat", "owl"] }, expected: 6 }, { input: { words: [] }, expected: 0 }], "near-transfer", "Add each new length to the saved total.", "ACCUMULATOR_OVERWRITTEN"),
  exercise("basket-cost-far", "accumulators", "Add up the basket", "Return total price for item records with price and quantity.", "def basket_cost(items):\n    total = 0\n    for item in items:\n        # Add this item's cost\n        pass\n    return total", [{ input: { items: [{ price: 3, quantity: 2 }, { price: 5, quantity: 1 }] }, expected: 11 }, { input: { items: [] }, expected: 0 }], "far-transfer", "Each item's cost contributes to the previous running total.", "ACCUMULATOR_OVERWRITTEN"),
  exercise("steps-to-zero-near", "while-loops", "Count steps to zero", "Return how many decrements a nonnegative start needs to reach zero.", "def steps_to_zero(start):\n    steps = 0\n    current = start\n    while current > 0:\n        # Update both loop state and steps\n        pass\n    return steps", [{ input: { start: 3 }, expected: 3 }, { input: { start: 0 }, expected: 0 }], "near-transfer", "Change current toward zero on every turn.", "WRONG_OR_MISSING_UPDATE"),
  exercise("double-until-limit-far", "while-loops", "Double until the limit", "Starting at 1, double while below limit; return the number of doublings. For limit <= 1 return 0.", "def doublings(limit):\n    value = 1\n    count = 0\n    while value < limit:\n        # Update value and count\n        pass\n    return count", [{ input: { limit: 8 }, expected: 3 }, { input: { limit: 1 }, expected: 0 }, { input: { limit: 10 }, expected: 4 }], "far-transfer", "The loop's value must change so it can reach the limit.", "WRONG_OR_MISSING_UPDATE"),
  exercise("shortest-word-near", "loop-mastery", "Find the shortest word", "Return the first shortest word in a nonempty list.", "def shortest_word(words):\n    shortest = words[0]\n    for word in words:\n        # Compare candidate with best so far\n        pass\n    return shortest", [{ input: { words: ["tree", "oak", "elm"] }, expected: "oak" }, { input: { words: ["first"] }, expected: "first" }], "near-transfer", "Keep the current candidate separate from the shortest found so far.", "VARIABLE_ROLE_CONFUSION"),
  exercise("most-frequent-far", "loop-mastery", "Find the most frequent value", "Return the most frequent value in a nonempty list; ties go to the value that first reached that frequency.", "def most_frequent(values):\n    counts = {}\n    best = values[0]\n    # Count values and track the best\n    return best", [{ input: { values: [2, 1, 2, 1, 2] }, expected: 2 }, { input: { values: ["a", "b", "b"] }, expected: "b" }], "far-transfer", "The current value, its count, and the best value have different jobs.", "VARIABLE_ROLE_CONFUSION"),
] satisfies (Exercise & { friendlyHint: string; expectedMisconception?: Misconception })[];

export const misconceptionCatalog: MisconceptionDefinition[] = [
  { code: "RANGE_ENDPOINT_EXCLUDED", displayName: "Boundary bug", description: "The loop stops before its intended final value.", intervention: { type: "RANGE_PATH_GAME", title: "Help Byte reach the final tile", estimatedMinutes: 2, instructions: ["Trace the numbered tiles visited by range(start, stop).", "Choose a stop value that lets Byte visit the target."] }, nearTransferId: "list-multiples-near", farTransferId: "days-in-month-far" },
  { code: "WRONG_INITIALIZATION", displayName: "Starting value mix-up", description: "A loop variable begins with a value that does not match its job.", intervention: { type: "STARTING_VALUE_PICKER", title: "Choose the starting value", estimatedMinutes: 2, instructions: ["Read the variable's job.", "Choose its value before any items have been processed."] }, nearTransferId: "count-long-words-near", farTransferId: "inventory-total-far" },
  { code: "ACCUMULATOR_OVERWRITTEN", displayName: "Running total reset", description: "The current loop value replaces earlier accumulated work.", intervention: { type: "RUNNING_TOTAL_BUILDER", title: "Build the running total", estimatedMinutes: 3, instructions: ["Follow the total after each loop turn.", "Add the new amount while keeping the earlier total."] }, nearTransferId: "sum-lengths-near", farTransferId: "basket-cost-far" },
  { code: "WRONG_OR_MISSING_UPDATE", displayName: "Loop state not moving", description: "The loop value does not move toward the stopping condition.", intervention: { type: "LOOP_STATE_REPAIR", title: "Repair the loop state", estimatedMinutes: 2, instructions: ["Check the loop condition.", "Choose an update that moves the state toward making it false."] }, nearTransferId: "steps-to-zero-near", farTransferId: "double-until-limit-far" },
  { code: "VARIABLE_ROLE_CONFUSION", displayName: "Variable job mix-up", description: "Variables with different roles are used as if they meant the same thing.", intervention: { type: "VARIABLE_ROLE_MATCHING", title: "Match each variable to its job", estimatedMinutes: 3, instructions: ["Match each name to its role.", "Trace the current item separately from the best-so-far value."] }, nearTransferId: "shortest-word-near", farTransferId: "most-frequent-far" },
];

export const demoFixtures = {
  learner: { id: "learner-01", name: "Maya", level: 4, xp: 1280, streak: 7 },
  learningPath: { id: "python-loops", moduleIds: ["variables", "conditions", "loop-boundaries", "accumulators", "while-loops", "loop-mastery"], activeModuleId: "loop-boundaries" },
  exerciseIds: demoExercises.map(({ id }) => id),
  initialExerciseIds: demoExercises.filter(({ exerciseType }) => exerciseType === "practice").map(({ id }) => id),
  quests: [
    { id: "quest-loop-lesson", title: "Complete a loop lesson", xpReward: 60 },
    { id: "quest-boundary-bug", title: "Fix a boundary bug", xpReward: 90 },
    { id: "quest-transfer", title: "Beat the transfer challenge", xpReward: 150 },
  ],
  reassessment: misconceptionCatalog.map(({ code, nearTransferId, farTransferId }) => ({ code, nearTransferId, farTransferId })),
  stateRules: { repeatedMisconception: "NEEDS_PRACTICE", correctNearTransfer: "IMPROVING", correctNearAndFarTransfer: "RESOLVED", ambiguousEvidence: "KEEP_PREVIOUS_STATE", duplicateQuestCompletion: "NO_ADDITIONAL_XP" },
};

export const demoScenarios = [
  { id: "boundary-near-improving", steps: ["RANGE_ENDPOINT_EXCLUDED diagnosis", "RANGE_PATH_GAME completed", "near transfer correct"], expectedState: "IMPROVING" },
  { id: "boundary-far-resolved", steps: ["RANGE_ENDPOINT_EXCLUDED diagnosis", "RANGE_PATH_GAME completed", "near and far transfers correct"], expectedState: "RESOLVED" },
  { id: "boundary-repeat-practice", steps: ["RANGE_ENDPOINT_EXCLUDED diagnosis", "same misconception on reassessment"], expectedState: "NEEDS_PRACTICE" },
  { id: "ambiguous-unchanged", steps: ["low confidence or close top probabilities", "diagnosis is UNCERTAIN"], expectedState: "UNCHANGED" },
  { id: "quest-idempotent", steps: ["complete eligible quest", "repeat completion request"], expectedState: "XP_GRANTED_ONCE" },
];
