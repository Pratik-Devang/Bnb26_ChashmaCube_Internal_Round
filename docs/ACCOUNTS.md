# Personal accounts

The website requires the FastAPI backend and PostgreSQL. Shared demo fallback is disabled for account data. Existing demo records and the old browser island save are not assigned to new accounts.

## Setup

1. Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` in the frontend environment.
2. Configure `RELEARN_DATABASE_URL` and `RELEARN_CORS_ORIGINS` in `relearn-api/.env`.
3. From `relearn-api`, run `.venv/Scripts/alembic.exe upgrade head` on Windows.
4. Keep the existing catalog seed; on a fresh database use the seed instructions in the API README.
5. Restart the API and Next.js servers, then create an account through the website.

For normal local development, run `npm run dev:full` from the repository root. It starts the API when needed, waits for its health check, and then starts Next.js. Running only `npm run dev` does not start the account API.

Use the same hostname for frontend and backend during development (both localhost, or both 127.0.0.1). Production requires HTTPS, a non-development `RELEARN_ENVIRONMENT`, and frontend/API URLs on the same site because the session uses SameSite=Lax cookies. Configure explicit trusted CORS origins. Deploy a shared login rate limiter at the edge; the included limiter is per-process.

## Storage and isolation

- `accounts` links a unique normalized email and salted scrypt password hash to a learner.
- `account_sessions` stores hashes of random session tokens with seven-day expiry. The raw token exists only in an HttpOnly cookie. Logout revokes that session.
- New learners start with zero XP and streak and no concept evidence, plus their own quest rows.
- Learning endpoints require a session and reject mismatched learner IDs. Attempt, diagnosis, intervention, and parent-attempt references are checked for ownership.
- `world_saves` stores First Island progression and preferences under a composite learner/location key. There is no shared localStorage save or automatic demo migration.
- World coins are computed from saved lesson completion, not the submitted coin total. World completion is still client-reported; it is not yet a server-verified achievement system or concept-resolution assessment.
- Profile preferences persist per account. Reminder delivery/audio behavior are separate from saving preferences.
- Practice-time charts have no tracking source yet, and Insights clearly labels its illustrative diagnosis rather than claiming it is personal evidence.

## Endpoints

Under `/api/v1/auth`: POST `/register`, POST `/login`, GET `/me`, POST `/logout`, GET/PUT `/worlds/first-island`, GET/PUT `/preferences`.

Mutating browser requests must include a trusted Origin. Requests use credentials; never put session tokens or passwords in localStorage. User-specific client requests include a learner identity check to prevent a stale tab saving into a different signed-in account.

## Verification

Account isolation tests are in `relearn-api/tests/test_accounts.py`. They cover fresh accounts, separate saves, cross-user record access, session revocation, login, and untrusted origins. They were added but not run, in accordance with the user's no-testing instruction. Run the API suite before deployment.

Email verification, password recovery, and session management across all devices are not implemented in this first account batch.
