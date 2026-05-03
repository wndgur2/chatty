# Chatty backend

NestJS API for Chatty: REST endpoints, Socket.IO streaming, Prisma/MySQL persistence, Ollama inference, Qdrant-backed memory retrieval, static profile image uploads, scheduled proactive AI evaluation, and optional FCM delivery.

For the public contracts, use:

- API and Socket.IO: `../documents/API_DOCUMENTATION.md`
- Database schema: `../documents/SCHEMA.md`
- Deployment/runtime: `../deploy/README.md`

## Stack

- NestJS 11 + TypeScript
- Prisma 6 + MySQL 8
- Socket.IO gateway for AI stream events
- Ollama chat/evaluator/embedding adapters
- Qdrant vector store for long-term memory snippets
- Firebase Admin SDK for optional push notifications
- Jest and Supertest for unit/e2e tests

## Prerequisites

- Node.js 18+ (repo targets current LTS-style versions)
- MySQL 8
- Qdrant
- Ollama with the configured chat, evaluator, and embedding models

## Getting started

1. **Install dependencies** (Prisma Client is generated on `postinstall`):

   ```bash
   npm install
   ```

2. **Environment** - create `backend/.env`:

   ```env
   DATABASE_URL="mysql://root:chatty_root@127.0.0.1:3306/chatty"
   JWT_SECRET="replace-with-a-strong-secret"
   JWT_EXPIRES_IN="7d"
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
   PUBLIC_ORIGIN="http://localhost:8080"
   CORS_ORIGIN="http://localhost:5173"
   ASSETS_DIR="./assets"
   ```

   Pull the local embedding model once:

   ```bash
   ollama pull all-minilm
   ```

   Memory indexing uses semantic chunking before embedding older user messages. Existing vectors remain valid and are not automatically backfilled.

   Optional (push notifications; leave empty to disable FCM sends):

   ```env
   FIREBASE_SERVICE_ACCOUNT_JSON=
   GOOGLE_APPLICATION_CREDENTIALS=
   ```

   **Port:** `PORT` defaults to **8080** in `main.ts` if unset.

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

## Main modules

| Module | Responsibility |
| --- | --- |
| `auth/` | Public username login, JWT issuing, global API guard support |
| `chatrooms/` | User-owned chatroom CRUD, image uploads, clone, branch |
| `messages/` | Message history, user send trigger, background AI generation, Socket.IO stream events |
| `messages/memory/` | Older-message chunking, embedding, vector indexing, retrieval formatting |
| `inference/` | Ports and Ollama adapters for chat completion, classification, and embeddings |
| `notifications/` | Device token registration, test notifications, proactive FCM sends |
| `tasks/` | Cron-based proactive evaluation and slow-start backoff |
| `infrastructure/storage/` | Local asset persistence under `/assets` |
| `infrastructure/vector-store/` | Qdrant client and vector-store adapter |

## WebSocket streaming

Streaming lives in `src/messages/messages.gateway.ts`.

- **Client → server**
  - `joinRoom` — `{ chatroomId: number }`
  - `leaveRoom` — `{ chatroomId: number }`
- **Server -> client**
  - `ai_typing_state` — `{ chatroomId, isTyping }`
  - `ai_message_chunk` — `{ chatroomId, chunk }`
  - `ai_message_complete` — `{ chatroomId, content, messageId }`

The `chunk` payload is cumulative current content. Join/leave handlers do not enforce JWT at the gateway event level today; protected REST routes still use the global JWT guard. See `../documents/API_DOCUMENTATION.md` for the complete event contract.

## Features (high level)

- **Auth** - `POST /api/auth/login` creates or loads a user and returns a JWT for Bearer-protected routes.
- **Chatrooms** - CRUD, optional profile image upload, clone/branch flows.
- **Messages** - history, user sends, streamed AI replies, memory retrieval, and proactive background sends.
- **Notifications** - device registration, test notification endpoint, and FCM sends when credentials are configured.
- **Static assets** - uploaded profile images are stored under `ASSETS_DIR` and served from `/assets`.

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
├── prisma/                 # schema, migrations
├── src/
│   ├── auth/
│   ├── chatrooms/
│   ├── messages/           # REST + MessagesGateway (Socket.IO)
│   │   └── memory/         # RAG indexing/retrieval helpers
│   ├── notifications/
│   ├── tasks/              # scheduled evaluation / proactive AI
│   ├── inference/          # ports, prompts, Ollama providers
│   ├── infrastructure/
│   ├── common/
│   └── ...
└── test/                   # e2e specs (e.g. app, chatrooms, messages)
```

## Data model

Do not duplicate entity definitions here. The Prisma-backed database contract is maintained in `../documents/SCHEMA.md`.

## Request flow (simplified)

```mermaid
sequenceDiagram
  participant Client as Client
  participant Auth as AuthController
  participant Chatrooms as ChatroomsController
  participant Messages as MessagesController
  participant Tasks as TasksService
  participant Eval as Ollama
  participant Push as FcmPushService
  participant Gateway as MessagesGateway
  participant AI as AI streaming path
  participant DB as Prisma

  Client->>Auth: POST /api/auth/login
  Auth->>DB: user upsert / load
  Auth-->>Client: JWT

  Client->>Chatrooms: POST /api/chatrooms (Bearer)
  Chatrooms->>DB: insert chatroom
  Chatrooms-->>Client: chatroom

  Client->>Messages: POST /api/chatrooms/:chatroomId/messages
  Messages->>DB: user message
  Messages->>AI: stream generation
  AI-->>Gateway: chunks / complete
  Gateway-->>Client: ai_message_chunk / ai_message_complete
  Messages->>DB: persist assistant message

  opt Proactive evaluation
    Tasks->>DB: rooms due for evaluation
    Tasks->>Eval: should answer?
    Eval-->>Tasks: decision
    alt send proactive message
      Tasks->>Messages: background send
      Messages->>AI: stream
      Gateway-->>Client: stream events
      Messages->>Push: optional FCM
    else defer
      Tasks->>DB: backoff / nextEvaluationTime
    end
  end
```
