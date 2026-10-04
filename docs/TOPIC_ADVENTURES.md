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

## Persistence and APIs

All endpoints below are under `/api/v1/auth/adventures` and require the current account session. Writes use the existing origin validation.

- `GET /catalog`: public lesson and question fields, no answer keys.
- `GET /progress`: `{ recent, saves }` for the signed-in learner only.
- `POST /start`: `{ world, track }`, creates or resumes a save and updates the recent selection.
- `POST /lesson`: `{ world, track, lessonId }`, enforces lesson order; repeat completions are idempotent.
- `POST /answer`: `{ world, track, questionId, answer }`, where answer is the option index. Requires all lessons and enforces challenge/transfer order. Returns `{ progress, correct, feedback, source: "authored" }`.

Saves use the existing `world_saves` table with keys such as `adventure:first-island:loops-medium`. The user ID is derived from the session. Changes lock the learner row so concurrent starts/answers cannot overwrite each other. No database migration is needed. Start the updated backend to register the new endpoints.

Coins are derived: 10 per lesson plus 50 after both checks (80 maximum per map/track). They are adventure coins, not global XP. Counters and the last 30 answer attempts are saved. Completion records practice, not demonstrated long-term mastery. A changed setting does not inherit another track's completions.

## Existing adventures and limitations

Original map content and account saves are preserved at `/game?legacy=1` and `/game/church?legacy=1`, linked from the setup screen. They are not silently migrated into difficulty tracks. The legacy chapel retains its original unlock requirement.

New question feedback is authored explanation, not an ML classifier result. The existing original code challenge/Oracle integrations remain in the legacy adventures. Before connecting the new tracks to ML, agree supported misconception labels with the model owner, add free-form code exercises and meaningful test cases, then add diagnosis-specific intervention and unseen reassessments. The current two fixed checks and repeatable answers must not be used as evidence that a misconception is resolved.

Manual review: create two accounts, start different topic/difficulty combinations on both maps, verify out-of-order guides redirect you, pass/fail checks, reload and resume, verify separate saves and reward caps, walk through chapel gates and back out, then inspect Home/Insights/Progress. Automated tests and browser checks were not run at the user's request.
