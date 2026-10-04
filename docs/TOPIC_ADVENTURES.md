# Topic adventures

Opening `/game` or `/game/church` now shows topic and difficulty selection. The five topics are variables, conditions, loops, lists, and functions; each has easy, medium, and hard content. A `?track=loops-medium` URL resumes that selection in the chosen map. `/church` redirects to the chapel setup.

## Content and map structure

- `relearn-api/app/data/adventure_curriculum.json`: one authoritative catalog with 15 tracks, 45 authored lessons, and 30 questions. Each track has three ordered lessons, a challenge, and a transfer check in another context. Medium questions include choosing code repairs; this initial curriculum does not accept free-form code solutions.
- `relearn-api/app/api/adventures.py`: authenticated catalog, progress, lesson completion, and answer checking. Correct answers and authored explanations are omitted from the catalog response and checked on the server.
- `lib/game/curriculum.ts`: frontend types, URLs, and API functions.
- `components/game/adventures/AdventureEntry.tsx`: selection and save loading.
- `components/game/adventures/TopicAdventureWorld.tsx`: shared movement, ordered guide encounters, dialogs, questions, and chapel entry/exit. Map-specific guide positions remain independent from learning content.
- `components/dashboard/AdventureJournal.tsx`: account-specific progress summaries on Home, Insights, and Progress.

First Island has three guides followed by the Scout. Chapel has its first guide outside; completing that lesson opens the gates, which teleport the explorer inside. The remaining guides and Keeper are inside. Either map can host any track without completing the other map first.

Every topic and difficulty on both active maps now has its own Python coding trial. The Scout or Chapel Keeper runs three cases in the in-browser Python worker. The API compares the reported outputs with its authoritative challenge catalog before saving the track’s first check; talking to the final guide again opens the authored transfer question. Submitted Python is not executed by the API server.

## Character conversations

Both topic-adventure maps welcome the explorer with a portrait conversation explaining the selected topic, difficulty, guide order, controls, and rewards. Human guides greet the player before opening their lesson or trial; locked encounters point to the earlier guide. The island's Cave Keeper offers directions without awarding progress. Animal guides retain their existing lesson interactions.

`components/game/dialogs/CharacterDialogue.tsx` and its CSS module provide the shared bottom-screen dialogue, using the Talk/Calm portraits from `2d_assets/Dialogue_person/NPC_1` through `NPC_4`. Text reveals gradually unless reduced motion is enabled. E or the Continue button reveals/advances text; Escape or Close dismisses it. Movement pauses while talking. Greeting or skipping a conversation never completes a lesson. Legacy map routes remain unchanged.

## Persistence and APIs

All endpoints below are under `/api/v1/auth/adventures` and require the current account session. Writes use the existing origin validation.

- `GET /catalog`: public lesson and question fields, no answer keys.
- `GET /progress`: `{ recent, saves }` for the signed-in learner only.
- `POST /start`: `{ world, track }`, creates or resumes a save and updates the recent selection.
- `POST /lesson`: `{ world, track, lessonId }`, enforces lesson order; repeat completions are idempotent.
- `POST /answer`: `{ world, track, questionId, answer }`, where answer is the option index. Requires all lessons and enforces challenge/transfer order. Returns `{ progress, correct, feedback, source: "authored" }`.
- `POST /code-answer`: `{ world, track, questionId, exerciseId, code, results }`, used by all 15 topic/difficulty coding trials. The API verifies the reported cases against its challenge catalog and never executes submitted code.

Saves use the existing `world_saves` table with keys such as `adventure:first-island:loops-medium`. The user ID is derived from the session. Changes lock the learner row so concurrent starts/answers cannot overwrite each other. No database migration is needed. Start the updated backend to register the new endpoints.

Coins are derived: 10 per lesson plus 50 after both checks (80 maximum per map/track). They are adventure coins, not global XP. Counters and the last 30 answer attempts are saved. Completion records practice, not demonstrated long-term mastery. A changed setting does not inherit another track's completions.

## Existing adventures and limitations

Original map content and account saves are preserved at `/game?legacy=1` and `/game/church?legacy=1`, linked from the setup screen. They are not silently migrated into difficulty tracks. The legacy chapel retains its original unlock requirement.

New question feedback is authored explanation, not an ML classifier result. The existing original code challenge/Oracle integrations remain in the legacy adventures. Before connecting the new tracks to ML, agree supported misconception labels with the model owner, add free-form code exercises and meaningful test cases, then add diagnosis-specific intervention and unseen reassessments. The current two fixed checks and repeatable answers must not be used as evidence that a misconception is resolved.

Manual review: create two accounts, start different topic/difficulty combinations on both maps, verify out-of-order guides redirect you, pass/fail checks, reload and resume, verify separate saves and reward caps, walk through chapel gates and back out, then inspect Home/Insights/Progress. Automated tests and browser checks were not run at the user's request.
