# Chatty

Chatty is a monorepo for a real-time AI chat application. It combines a React/Vite SPA, a NestJS API, MySQL persistence through Prisma, local Ollama inference, Qdrant-backed long-term memory retrieval, Socket.IO streaming, and optional Firebase Cloud Messaging (FCM).

## Core capabilities

- User login with JWT-backed API access.
- Multiple user-owned chatrooms with per-room prompt and profile image settings.
- User-triggered AI replies streamed over Socket.IO.
- Scheduled proactive AI messages decided by a lightweight evaluator model.
- Clone and branch flows for chatrooms.
- Optional web push notifications for proactive or test notification flows.
- Retrieval-augmented memory over older user messages using Ollama embeddings and Qdrant.

## Architecture at a glance

| Layer | Current implementation |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 4, React Router 7, TanStack Query, Socket.IO client |
| Backend | NestJS 11, TypeScript, Prisma, Socket.IO gateway, scheduled tasks |
| Persistence | MySQL 8 for relational data and Qdrant for vector memory |
| AI runtime | Ollama chat, evaluator, and embedding models |
| Push | Firebase Admin on the backend and Firebase Web/VAPID on the frontend |
| Delivery | nginx + Docker Compose for the full stack |

## Repository layout

- `frontend/` - Vite SPA. See `frontend/README.md`.
- `backend/` - REST API, Socket.IO gateway, scheduler, uploads, and AI/RAG integration. See `backend/README.md`.
- `deploy/` - nginx, production Compose, deploy script, and deployment notes. See `deploy/README.md`.
- `documents/` - source contracts and product context:
  - `documents/API_DOCUMENTATION.md`
  - `documents/SCHEMA.md`
  - `documents/PROJECT_PROPOSAL.md`
- `docker-compose.dev.yml` - local full-stack Compose setup with MySQL, Qdrant, backend, and nginx.
- `.github/ci-cd.md` - CI/CD operational notes.

## Quick start: split local development

Use this flow when you want frontend/backend hot reload on the host.

1. Start or provide MySQL and Qdrant.
   - Host-run backend expects service URLs in `backend/.env`.
   - The root `docker-compose.dev.yml` services are primarily wired for the full Docker network; publish additional ports if you want host processes to use them directly.
2. Backend:

   ```bash
   cd backend
   npm install
   npm run prisma:migrate:dev
   npm run dev
   ```

   Create `backend/.env` from the variables described in `backend/README.md`.

3. Frontend:

   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

   Set `VITE_API_URL` to the backend origin, for example `http://localhost:8080`.

## Quick start: Docker full stack

The Docker flow builds the frontend into nginx and runs MySQL, Qdrant, backend, and nginx together.

```bash
cp .env.docker.example .env
docker compose -f docker-compose.dev.yml up -d --build
```

Open the URL configured by `PUBLIC_ORIGIN` / `HTTP_PORT` (default: `http://localhost:8080`). Pull any Ollama models configured in `.env` on the machine running Ollama before first use.

See `deploy/README.md` for environment details, smoke tests, troubleshooting, and production deployment notes.

## Contracts and references

- REST and Socket.IO contract: `documents/API_DOCUMENTATION.md`
- Database schema contract: `documents/SCHEMA.md`
- Backend operational details: `backend/README.md`
- Frontend operational details: `frontend/README.md`
- Deployment: `deploy/README.md`
