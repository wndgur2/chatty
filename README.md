# Chatty

Chatty is an AI-based chat application with real-time streamed responses and scheduled, voluntary AI messages. The project is organized as a local-first monorepo with a React frontend, NestJS backend, MySQL, and Ollama.

## Core Capabilities

- Real-time AI response streaming over Socket.IO.
- Slow-start voluntary AI trigger flow based on scheduled evaluations.
- Multi-chatroom support with per-room prompt and profile image customization.
- Clone and branch chatrooms for reusable conversation setups.
- Optional Firebase Cloud Messaging (FCM) support for push notifications.

## Architecture Snapshot

- Frontend: React + TypeScript + Tailwind + TanStack Query
- Backend: NestJS + TypeScript + Prisma
- Database: MySQL
- LLM runtime: Ollama (local)
- Realtime: Socket.IO WebSocket events
- Optional notifications: Firebase Admin / FCM

## Monorepo Layout

- `frontend/`: React web app.
- `backend/`: NestJS API + WebSocket gateway + scheduler logic.
- `deploy/`: Docker/nginx deployment assets and deployment guide.
- `contexts/`: product proposal, API contract, and schema reference docs.

## Quick Start (Local Development)

Use this path when developing frontend/backend directly without Dockerized nginx.

1. Backend setup:
   - Go to `backend/`.
   - Install dependencies: `npm install`
   - Configure `.env` (database/JWT/Ollama values)
   - Run migrations: `npm run prisma:migrate:dev`
   - Start dev server: `npm run dev`
2. Frontend setup:
   - Go to `frontend/`.
   - Install dependencies: `npm install`
   - Start dev server: `npm run dev`

For backend-specific commands and details, see `backend/README.md`.
For frontend-specific commands and details, see `frontend/README.md`.

## Quick Start (Docker Deployment)

Use this path for a containerized stack (MySQL + backend + nginx-served frontend).

1. Copy env template:
   - `cp .env.docker.example .env`
2. Build and run:
   - `docker compose up -d --build`
3. Open:
   - `http://localhost:8080` (or your configured `PUBLIC_ORIGIN` / `HTTP_PORT`)

Full deployment instructions and troubleshooting are documented in `deploy/README.md`.

## API and WebSocket References

REST and event contracts are documented in:

- `contexts/API_DOCUMENTATION.md`

Important Socket.IO events include:

- Client -> Server: `joinRoom`, `leaveRoom`
- Server -> Client: `ai_typing_state`, `ai_message_chunk`, `ai_message_complete`

## Documentation Index

- Product proposal: `contexts/PROJECT_PROPOSAL.md`
- API contract: `contexts/API_DOCUMENTATION.md`
- Data model: `contexts/SCHEMA.md`
- Frontend testing guide: `contexts/FRONTEND_TESTING.md`
- Backend guide: `backend/README.md`
- Frontend guide: `frontend/README.md`
- Deployment guide: `deploy/README.md`
