# re:learn web

Re:Learn is a game-oriented learning experience for beginner Python learners. It turns an incorrect solution into a friendly diagnosis, a short targeted learning game, and a transfer question that checks whether the idea now makes sense.

This directory contains the frontend scaffold only. It uses Next.js 16, React 19, TypeScript, the App Router, plain CSS, React state, and mock data. There is no authentication, database, model inference, backend integration, or server-side Python execution in this version.

## Architecture

- `app/` contains the dashboard route, global design system, metadata, and responsive layout.
- `components/dashboard/` contains product-specific learning path, mini-game, quest, navigation, and progress components.
- `components/ui/` contains small reusable visual primitives.
- `types/learning.ts` defines the frontend domain and planned API contracts.
- `lib/mock-data.ts` is the single source for temporary learner, lesson, quest, exercise, and diagnosis content.
- `lib/api.ts` is the typed boundary for the future FastAPI backend. React components should call this module rather than using URLs directly.
- `lib/code-runner.ts` defines the future Pyodide Web Worker adapter. Pyodide is intentionally not installed yet.

The full system design and endpoint contracts live in [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) and [`../docs/API_CONTRACTS.md`](../docs/API_CONTRACTS.md).

## Run locally

Requirements: a current Node.js LTS release and npm.

```bash
cd relearn-web
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Connect FastAPI later

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local`, then replace the mock-return branches in `lib/api.ts` with `fetch` calls. Keep response parsing in that module so presentation components remain independent of transport and mock-data details.

Python learner code should run only in a restricted Pyodide Web Worker with predefined tests and time limits. Connect that worker through `lib/code-runner.ts`; never execute learner code in Next.js or FastAPI processes.

## Current interactions

- Search the learning path.
- Expand beginner tips on lessons.
- Start or pause the Loop Boundaries mini-game.
- Complete each daily quest and gain its XP once.
- Switch dashboard navigation sections.

All state is session-only and resets on refresh.
