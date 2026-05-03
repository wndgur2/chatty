# Chatty

Chatty is an AI chat application with real-time streamed replies and scheduled, proactive AI messages. The repo is a monorepo: React frontend, NestJS backend, MySQL (Prisma), Ollama for local LLM calls/embeddings, and Qdrant for long-term memory retrieval.

## Core capabilities

- Real-time AI streaming over Socket.IO.
- Proactive AI messages driven by scheduled evaluations (slow-start style).
- Multiple chatrooms with per-room base prompt and profile image.
- Clone (copy settings) and branch (copy history + settings) chatrooms.
- Optional Firebase Cloud Messaging (FCM) for push notifications.

## Architecture

| Layer           | Technology                                                                   |
| --------------- | ---------------------------------------------------------------------------- |
| Frontend        | React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, Socket.IO client |
| Backend         | NestJS 11, TypeScript, Prisma                                                |
| Database        | MySQL 8                                                                      |
| LLM             | Ollama (HTTP API)                                                            |
| Vector store    | Qdrant                                                                       |
| Realtime        | Socket.IO                                                                    |
| Push (optional) | Firebase Admin (backend), Firebase Web + VAPID (frontend)                  |

## Repository layout

- `frontend/` — Vite SPA (details: [`frontend/README.md`](frontend/README.md)).
- `backend/` — REST API, WebSocket gateway, scheduling, file uploads (details: [`backend/README.md`](backend/README.md)).
- `deploy/` — nginx image, production Compose, deploy scripts (details: [`deploy/README.md`](deploy/README.md)).
- `docker-compose.dev.yml` — local full stack: MySQL, backend, nginx (built frontend).
- `.cursor/skills/` — agent skills and runbooks.
- `.cursor/rules/` — editor/agent rules for this codebase.

## Quick start

### Split local dev (hot reload)

Use a local MySQL (or publish `3306` from Compose if the DB runs in Docker while the app runs on the host). Configure env files and run backend and frontend separately — step-by-step commands, ports, and MySQL notes are in [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md).

### Docker full stack

MySQL + backend + nginx serving the production build of the frontend: configure `.env` from `.env.docker.example`, pull Ollama models as needed, then `docker compose -f docker-compose.dev.yml up -d --build`. Full prerequisites, env variables, smoke checks, and troubleshooting are in [`deploy/README.md`](deploy/README.md).

Production CD (ARM64 images, serialized deploys) is summarized in [`.github/ci-cd.md`](.github/ci-cd.md).

## API and contracts

REST, Socket.IO payloads, and auth behavior are documented in [`documents/API_DOCUMENTATION.md`](documents/API_DOCUMENTATION.md). The database model is in [`documents/SCHEMA.md`](documents/SCHEMA.md) (generated schema and migrations live under `backend/prisma/`).

## Documentation index

- Product proposal: [`documents/PROJECT_PROPOSAL.md`](documents/PROJECT_PROPOSAL.md)
- API contract: [`documents/API_DOCUMENTATION.md`](documents/API_DOCUMENTATION.md)
- Data model: [`documents/SCHEMA.md`](documents/SCHEMA.md)
- Backend: [`backend/README.md`](backend/README.md)
- Frontend: [`frontend/README.md`](frontend/README.md)
- Docker / deploy: [`deploy/README.md`](deploy/README.md)
- CI/CD operations: [`.github/ci-cd.md`](.github/ci-cd.md)
