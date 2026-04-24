# Chatty

Chatty is an AI chat application with real-time streamed replies and scheduled, voluntary AI messages. The repo is a monorepo: React frontend, NestJS backend, MySQL (Prisma), and Ollama for local LLM calls.

## Core capabilities

- Real-time AI streaming over Socket.IO.
- Voluntary AI messages driven by scheduled evaluations (slow-start style).
- Multiple chatrooms with per-room base prompt and profile image.
- Clone (copy settings) and branch (copy history + settings) chatrooms.
- Optional Firebase Cloud Messaging (FCM) for push notifications.

## Architecture

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, Socket.IO client |
| Backend | NestJS 11, TypeScript, Prisma |
| Database | MySQL 8 |
| LLM | Ollama (HTTP API) |
| Realtime | Socket.IO |
| Push (optional) | Firebase Admin (backend), Firebase Web + VAPID (frontend) |

## Repository layout

- `frontend/` — Vite SPA.
- `backend/` — REST API, WebSocket gateway, cron-style scheduling, file uploads.
- `deploy/` — nginx image, production Compose, deploy scripts, deployment notes.
- `docker-compose.dev.yml` — local full stack: MySQL, backend, nginx (built frontend).
- `.cursor/skills/` — agent skills and API reference material.
- `.cursor/rules/` — editor/agent rules for this codebase.

## Quick start (split local dev)

Best when you work on frontend or backend alone and want hot reload.

1. **MySQL** (example using Compose for DB only):

   ```bash
   docker compose -f docker-compose.dev.yml up -d mysql
   ```

2. **Backend** (`backend/`):

   ```bash
   npm install
   ```

   Create `backend/.env` (see `backend/README.md`). Then:

   ```bash
   npm run prisma:migrate:dev
   npm run dev
   ```

   The API listens on **`http://localhost:8080`** unless you set `PORT`.

3. **Frontend** (`frontend/`):

   ```bash
   npm install
   cp .env.example .env
   ```

   Set `VITE_API_URL` to your backend origin (no trailing slash), e.g. `http://localhost:8080`. Then:

   ```bash
   npm run dev
   ```

   Vite serves the app (by default `http://localhost:5173`).

Details: `backend/README.md`, `frontend/README.md`.

## Quick start (Docker full stack)

MySQL + backend + nginx serving the production build of the frontend.

1. From the repo root:

   ```bash
   cp .env.docker.example .env
   ```

2. Adjust `.env` (JWT secret, origins, Ollama host/models, optional Firebase). If you change `PUBLIC_ORIGIN`, `CORS_ORIGIN`, or any `VITE_*` build args, rebuild images.

3. Run:

   ```bash
   docker compose -f docker-compose.dev.yml up -d --build
   ```

4. Open **`http://localhost:8080`** (or the host/port matching `PUBLIC_ORIGIN` / `HTTP_PORT`).

Full deployment and troubleshooting: `deploy/README.md`.

## API and WebSocket reference

- REST and Socket.IO contracts: `.cursor/skills/api-development/references/API_DOCUMENTATION.md`

Common Socket.IO events:

- Client → server: `joinRoom`, `leaveRoom`
- Server → client: `ai_typing_state`, `ai_message_chunk`, `ai_message_complete`

## Documentation index

- Product proposal: `.cursor/references/PROJECT_PROPOSAL.md`
- API contract: `.cursor/skills/api-development/references/API_DOCUMENTATION.md`
- Data model: `.cursor/references/SCHEMA.md`
- Backend: `backend/README.md`
- Frontend: `frontend/README.md`
- Docker / deploy: `deploy/README.md`
- CI/CD operations: `.github/ci-cd.md`
