---
name: cloud-agent-starter
description: Minimal starter runbook for Cloud agents to set up, run, and test Chatty quickly across backend, frontend, and Docker workflows.
---

# Cloud Agent Starter: Run and Test Chatty

## When to use

Use this at the start of Cloud-agent tasks to avoid rediscovering setup details. It is intentionally minimal and command-first.

## 1) Repo bootstrap (all tasks)

1. Install dependencies once:
   - `cd /workspace/backend && npm install`
   - `cd /workspace/frontend && npm install`
2. Choose execution mode:
   - Split local dev: run backend and frontend separately (best for focused frontend/backend work).
   - Docker full stack: run MySQL + backend + nginx-served frontend together (best for fast end-to-end smoke checks).

## 2) Backend area (`backend/`)

### Setup and run

1. Create `backend/.env`:
   - `DATABASE_URL="mysql://root:chatty_root@127.0.0.1:3306/chatty"`
   - `JWT_SECRET="dev-secret-change-me"`
   - `JWT_EXPIRES_IN="7d"`
   - `OLLAMA_HOST="http://127.0.0.1:11434"`
   - `OLLAMA_CHAT_MODEL="qwen2.5:1.5b"`
   - `OLLAMA_EVAL_MODEL="qwen2.5:1.5b"`
2. Start MySQL quickly (if not already running):
   - `cd /workspace && docker compose -f deploy/docker-compose.dev.yml up -d mysql`
3. Apply schema:
   - `cd /workspace/backend && npm run prisma:migrate:dev`
4. Start backend:
   - `cd /workspace/backend && npm run dev`
   - Default port is `8080` unless `PORT` is overridden.

### Backend smoke test workflow

1. Login (creates user automatically if missing):
   - `curl -sS -X POST http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{"username":"cloud-agent"}'`
2. Use returned bearer token to verify protected endpoints:
   - `GET /api/chatrooms`
   - `POST /api/chatrooms`
3. If testing message generation, ensure Ollama is reachable first. If Ollama is unavailable, limit smoke tests to auth/chatrooms/history flows.

### Backend test workflow

- Fast checks for most backend changes:
  - `cd /workspace/backend && npm run lint`
  - `cd /workspace/backend && npm run test`
- For API integration confidence:
  - `cd /workspace/backend && npm run test:e2e`
- Note: current e2e specs intentionally keep some rows for inspection; use dedicated test usernames to avoid confusion.

## 3) Frontend area (`frontend/`)

### Setup and run

1. Create env file:
   - `cp /workspace/frontend/.env.example /workspace/frontend/.env`
2. Ensure backend URL matches your running backend:
   - `VITE_API_URL=http://localhost:8080`
3. Start frontend:
   - `cd /workspace/frontend && npm run dev`
   - Vite default URL is typically `http://localhost:5173`.

### Frontend manual smoke workflow

1. Open frontend URL.
2. Log in with any username (no password flow in this codebase).
3. Verify chatroom CRUD basics from UI (create/open/delete or clone/branch path).
4. If Ollama is running, send a message and verify streaming behavior; otherwise stop at non-AI UI flows.

### Frontend test workflow

- Fast checks for most frontend changes:
  - `cd /workspace/frontend && npm run lint`
  - `cd /workspace/frontend && npm run typecheck`
  - `cd /workspace/frontend && npm run test:unit`
- For cross-component flow confidence:
  - `cd /workspace/frontend && npm run test:integration`
  - Targeted: `cd /workspace/frontend && npx vitest run tests/integration/chatroom-send.integration.test.tsx`

## 4) Full-stack area (`deploy/docker-compose.dev.yml`)

### Setup and run

1. Seed root env:
   - `cd /workspace/deploy && cp .env.docker.example .env`
2. Start full stack:
   - `cd /workspace/deploy && docker compose -f deploy/docker-compose.dev.yml up -d --build`
3. Open app:
   - `http://localhost:8080`

### Full-stack smoke workflow

1. Log in from browser with any username.
2. Create a chatroom.
3. Send a message only if Ollama host in `.env` is valid from containers.
4. Optional API check:
   - `curl -sS -X POST http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{"username":"cloud-compose"}'`

## 5) Environment-based feature switches and mocks

This repo does not currently use explicit `FEATURE_*` flags. Practical toggles are env-driven:

- Push notifications (backend): if `FIREBASE_SERVICE_ACCOUNT_JSON` and `GOOGLE_APPLICATION_CREDENTIALS` are both empty, backend keeps running and FCM send is effectively disabled.
- Push notifications (frontend): if Firebase env vars or `VITE_FCM_VAPID_KEY` are missing, push UI should settle into `config_missing`/disabled behavior.
- Release metadata: `VITE_RELEASE_SHA` and `VITE_RELEASE_BUILT_AT` are optional and safe to omit locally.

Mocking guidance:

- For frontend tests, prefer `vi.stubEnv(...)` to simulate Firebase present/missing states.
- For backend tasks where FCM is unrelated, keep FCM credentials empty and validate core APIs independently.

## 6) How to update this skill when new runbook knowledge is found

When you discover a new reliable setup/testing trick:

1. Add it under the correct area section (`backend`, `frontend`, or `full-stack`), not as a generic note.
2. Include:
   - exact command(s),
   - when to use it,
   - expected signal (what proves it worked),
   - one known failure mode if relevant.
3. Keep entries minimal; replace stale steps instead of appending duplicates.
4. If a trick is used in 2+ PRs, promote it from ad-hoc note to default workflow in this skill.
