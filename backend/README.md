# Chatty backend

NestJS API, Socket.IO streaming gateway, Prisma/MySQL persistence, Ollama integration, Qdrant-backed long-term memory retrieval (RAG), optional FCM, and scheduled evaluation for proactive AI messages.

Monorepo context: [`../README.md`](../README.md). REST and Socket.IO contracts: [`../documents/API_DOCUMENTATION.md`](../documents/API_DOCUMENTATION.md). Database model: [`../documents/SCHEMA.md`](../documents/SCHEMA.md). Product/scheduling notes: [`../documents/PROJECT_PROPOSAL.md`](../documents/PROJECT_PROPOSAL.md).

## Tech stack

- [NestJS](https://nestjs.com/) 11, TypeScript
- [Prisma](https://www.prisma.io/) + MySQL 8
- [Qdrant](https://qdrant.tech/) vector store for long-term memory search
- [Jest](https://jestjs.io/) + Supertest (unit + e2e)
- Static uploads via `@nestjs/serve-static` and Multer (`@nestjs/platform-express`)
- [Socket.IO](https://socket.io/) (`@nestjs/platform-socket.io`)

## Git workflow

Shared branching, commits, and PR conventions: [`.cursor/skills/git/SKILL.md`](../.cursor/skills/git/SKILL.md).

## Prerequisites

- Node.js 18+ (repo targets current LTS-style versions)
- MySQL 8, Qdrant, and Ollama (local installs or shared services from root `docker-compose.dev.yml`)

## Getting started

1. **Install dependencies** (Prisma Client is generated on `postinstall`):

   ```bash
   npm install
   ```

2. **Environment** — create `backend/.env` (see variables below). Pull the local embedding model once:

   ```bash
   ollama pull all-minilm
   ```

   Memory indexing uses semantic chunking before embedding for older user messages. Existing vectors remain valid and are not automatically backfilled.

   Optional (push notifications; leave empty to disable FCM sends):

   ```env
   FIREBASE_SERVICE_ACCOUNT_JSON=
   GOOGLE_APPLICATION_CREDENTIALS=
   ```

   **Port:** `PORT` defaults to **8080** in `main.ts` if unset.

   Example baseline (adjust credentials and hosts):

   ```env
   DATABASE_URL="mysql://root:chatty_root@127.0.0.1:3306/chatty"
   JWT_SECRET="replace-with-a-strong-secret"
   JWT_EXPIRES_IN="7d"
   PUBLIC_ORIGIN="http://localhost:5173"
   CORS_ORIGIN="http://localhost:5173"
   OLLAMA_HOST="http://127.0.0.1:11434"
   OLLAMA_CHAT_MODEL="qwen2.5:1.5b"
   OLLAMA_EVAL_MODEL="qwen2.5:1.5b"
   OLLAMA_EMBED_MODEL="all-minilm"
   QDRANT_URL="http://127.0.0.1:6333"
   QDRANT_COLLECTION="chat_memory"
   RAG_RECENT_WINDOW="8"
   RAG_TOP_K="5"
   RAG_MIN_SCORE="0.4"
   RAG_SNIPPET_CHARS="200"
   RAG_CHUNK_MIN_CHARS="200"
   RAG_CHUNK_MIN_SENTENCES="3"
   RAG_CHUNK_BUFFER_SIZE="1"
   RAG_CHUNK_BREAKPOINT_PERCENTILE="95"
   RAG_CHUNK_MAX_CHARS="1200"
   RAG_CHUNK_OVERLAP_CHARS="200"
   ASSETS_DIR="src/assets"
   ```

3. **Database**

   ```bash
   npm run prisma:migrate:dev
   ```

   `npx prisma generate` is not usually needed after `npm install`, but you can run it after schema changes if the client is stale.

4. **Run**

   ```bash
   npm run dev          # watch mode (typical local dev)
   npm run start        # single run
   npm run start:prod   # production (compiled dist)
   ```

## WebSocket streaming

Implementation: `src/messages/messages.gateway.ts`. Event names and payload shapes (including cumulative `ai_message_chunk` semantics and JWT behavior at the gateway) are documented in [`../documents/API_DOCUMENTATION.md`](../documents/API_DOCUMENTATION.md). The HTTP send endpoint returns `202 Accepted`; the generated AI reply is delivered asynchronously over Socket.IO.

## Features (high level)

- **Auth** — `POST /api/auth/login` creates or loads a user and returns a JWT for Bearer-protected routes.
- **Chatrooms** — CRUD, optional profile image upload, clone/branch flows.
- **Messages** — history, user sends, streamed AI replies, background proactive sends coordinated with tasks/cron.
- **Notifications** — device registration and FCM when credentials are configured.

## Scripts

```bash
npm run lint                 # ESLint
npm run test                 # Unit tests (*.spec.ts under src/)
npm run test:e2e             # E2E (test/*.e2e-spec.ts)
npm run test:cov             # Coverage
npm run prisma:migrate:dev   # Dev migrations
npm run prisma:migrate:deploy # Deploy migrations (CI/prod)
```

## Project structure

```text
backend/
├── prisma/                 # schema, migrations (source of truth for DDL)
├── src/
│   ├── auth/
│   ├── chatrooms/
│   ├── messages/           # REST + MessagesGateway (Socket.IO)
│   ├── notifications/
│   ├── tasks/              # scheduled evaluation / proactive AI
│   ├── inference/
│   ├── infrastructure/
│   ├── common/
│   └── ...
└── test/                   # e2e specs (e.g. app, chatrooms, messages)
```

Scheduling constants for proactive AI (initial delay, cron cadence, streak cap) live in `src/tasks/scheduling.constants.ts` and are summarized in [`../documents/PROJECT_PROPOSAL.md`](../documents/PROJECT_PROPOSAL.md).
