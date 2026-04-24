# Chatty backend

NestJS API, Socket.IO streaming gateway, Prisma/MySQL persistence, Ollama integration, optional FCM, and scheduled voluntary-AI evaluation.

## Tech stack

- [NestJS](https://nestjs.com/) 11, TypeScript
- [Prisma](https://www.prisma.io/) + MySQL 8
- [Jest](https://jestjs.io/) + Supertest (unit + e2e)
- Static uploads via `@nestjs/serve-static` and Multer (`@nestjs/platform-express`)
- [Socket.IO](https://socket.io/) (`@nestjs/platform-socket.io`)

## Git workflow

Shared branching, commits, and PR conventions:

- `.cursor/skills/git/SKILL.md`

## Prerequisites

- Node.js 18+ (repo targets current LTS-style versions)
- MySQL 8 (local install or Docker from root `docker-compose.dev.yml`)

## Getting started

1. **Install dependencies** (Prisma Client is generated on `postinstall`):

   ```bash
   npm install
   ```

2. **Environment** — create `backend/.env`:

   ```env
   DATABASE_URL="mysql://root:chatty_root@127.0.0.1:3306/chatty"
   JWT_SECRET="replace-with-a-strong-secret"
   JWT_EXPIRES_IN="7d"
   OLLAMA_HOST="http://127.0.0.1:11434"
   OLLAMA_CHAT_MODEL="qwen2.5:1.5b"
   OLLAMA_EVAL_MODEL="qwen2.5:1.5b"
   ```

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

## WebSocket streaming

Streaming lives on the **messages** gateway: `src/messages/messages.gateway.ts`.

- **Client → server**
  - `joinRoom` — `{ chatroomId: number }`
  - `leaveRoom` — `{ chatroomId: number }`
- **Server → client**
  - `ai_typing_state` — `{ chatroomId, isTyping }`
  - `ai_message_chunk` — `{ chatroomId, chunk }`
  - `ai_message_complete` — `{ chatroomId, content, messageId }`

Join/leave handlers do not validate JWT at the gateway today; treat the socket surface accordingly for your threat model.

## Features (high level)

- **Auth** — `POST /api/auth/login` creates or loads a user and returns a JWT for Bearer-protected routes.
- **Chatrooms** — CRUD, optional profile image upload, clone/branch flows.
- **Messages** — history, user sends, streamed AI replies, background voluntary sends coordinated with tasks/cron.
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
├── prisma/                 # schema, migrations
├── src/
│   ├── auth/
│   ├── chatrooms/
│   ├── messages/           # REST + MessagesGateway (Socket.IO)
│   ├── notifications/
│   ├── tasks/              # scheduled evaluation / voluntary AI
│   ├── ollama/
│   ├── infrastructure/
│   ├── common/
│   └── ...
└── test/                   # e2e specs (e.g. app, chatrooms, messages)
```

## Entity overview

```mermaid
erDiagram
  User ||--o{ UserDevice : has
  User ||--o{ Chatroom : owns
  Chatroom ||--o{ Message : contains

  User {
    bigint id PK
    string username UK
    datetime createdAt
    datetime updatedAt
  }

  UserDevice {
    bigint id PK
    bigint userId FK
    string deviceToken UK
    datetime registeredAt
  }

  Chatroom {
    bigint id PK
    bigint userId FK
    string name
    string basePrompt
    string profileImageUrl
    int currentDelaySeconds
    datetime nextEvaluationTime
    datetime createdAt
    datetime updatedAt
  }

  Message {
    bigint id PK
    bigint chatroomId FK
    enum sender
    string content
    datetime createdAt
  }
```

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

  Client->>Messages: POST /api/messages
  Messages->>DB: user message
  Messages->>AI: stream generation
  AI-->>Gateway: chunks / complete
  Gateway-->>Client: ai_message_chunk / ai_message_complete
  Messages->>DB: persist assistant message

  opt Voluntary evaluation
    Tasks->>DB: rooms due for evaluation
    Tasks->>Eval: should answer?
    Eval-->>Tasks: decision
    alt send voluntary message
      Tasks->>Messages: background send
      Messages->>AI: stream
      Gateway-->>Client: stream events
      Messages->>Push: optional FCM
    else defer
      Tasks->>DB: backoff / nextEvaluationTime
    end
  end
```
