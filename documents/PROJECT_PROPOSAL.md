# Proposal Document: AI Chat App "Chatty"

## 1. Introduction

Chatty is a web-based AI chat application for multi-room conversations with real-time streamed AI replies and scheduled proactive AI messages. The current implementation uses a React/Vite frontend, a NestJS backend, MySQL/Prisma for relational state, Ollama for local model inference, Qdrant for vector memory retrieval, and optional Firebase Cloud Messaging (FCM).

Authoritative implementation contracts:

- API and Socket.IO: `API_DOCUMENTATION.md`
- Database schema: `SCHEMA.md`
- Runtime/deployment details: `../deploy/README.md`

---

## 2. Objectives

- Provide a web chat system powered by local LLMs.
- Support multiple user-owned chatrooms with separate prompts, profile images, message history, and scheduling state.
- Stream AI responses to the active room over Socket.IO.
- Enable AI to initiate messages after scheduled evaluation.
- Preserve useful older user messages as retrievable long-term memory.
- Deliver optional web push notifications for proactive AI activity.

---

## 3. Scope of Work

### 3.1 Core Features

#### 3.1.1 Authentication

- Username-based login creates or loads a user.
- Login returns a JWT used as `Authorization: Bearer <accessToken>` for protected REST endpoints.
- Public routes are limited to `GET /` and `POST /api/auth/login`.

#### 3.1.2 Chatroom Management

- Create, retrieve, update, and delete chatrooms.
- Store `name`, `basePrompt`, optional `profileImageUrl`, and per-room proactive scheduling state.
- Upload profile images through multipart chatroom create/update flows.
- Clone a chatroom by copying configuration only.
- Branch a chatroom by copying configuration and message history.

#### 3.1.3 Streamed LLM Responses

- Send a user message by REST (`POST /api/chatrooms/{chatroomId}/messages`).
- Persist the user message immediately and return `202 Accepted`.
- Generate the AI response asynchronously.
- Emit cumulative stream content and completion events to the room over Socket.IO.

#### 3.1.4 Proactive AI Messaging

- Run scheduled evaluations with `@nestjs/schedule`.
- Use a slow-start/backoff model:
  - Application flow resets rooms to an initial 4-second delay after AI generation.
  - Database default for newly created rooms is 60 seconds until app logic changes it.
  - Due rooms are evaluated by a lightweight Ollama evaluator.
  - A positive decision triggers a proactive AI message.
  - A negative decision doubles the delay and schedules the next evaluation.
- Cap consecutive proactive AI messages to prevent runaway AI-only conversations.

#### 3.1.5 Long-Term Memory Retrieval

- Index older user messages outside the recent context window.
- Chunk older messages with semantic chunking before embedding.
- Store vectors in Qdrant with message/chatroom/user metadata.
- Retrieve top-scoring memory snippets and inject them into the generation system prompt.

#### 3.1.6 Notifications

- Register FCM device tokens for authenticated users.
- Send proactive-message notifications when Firebase credentials are configured.
- Provide a protected test notification endpoint for validating a chatroom's owner/device flow.

#### 3.1.7 AI Message Metadata

- Store delivery/explainability metadata for AI-authored messages in `ai_message_metadata`.
- Track read state with nullable `read_at`.
- Track delivery type with `delivery_mode` (`reply` or `proactive`).
- Store trigger diagnostics with `trigger_reason` and optional JSON `trigger_context`.

---

## 4. System Overview

### 4.1 Architecture Summary

| Area | Current implementation |
| --- | --- |
| Frontend | React 19, Vite 7, TypeScript, Tailwind CSS 4, React Router 7, TanStack Query |
| Backend | NestJS 11 REST API, global JWT guard, Socket.IO gateway, scheduled tasks |
| Relational data | MySQL 8 accessed through Prisma |
| AI runtime | Ollama chat, evaluator/classification, and embedding adapters |
| Vector memory | Qdrant collection configured by `QDRANT_COLLECTION` |
| Notifications | Firebase Admin SDK and Firebase Web/VAPID |
| Delivery | nginx plus Docker Compose for local/full-stack and production runtime |

### 4.2 Primary Data and Contract References

- REST and realtime endpoint shapes are maintained in `API_DOCUMENTATION.md`.
- Relational entities and DDL are maintained in `SCHEMA.md`.
- Feature READMEs should reference those contracts instead of copying endpoint/schema definitions.

---

## 5. Roles and Responsibilities

### 5.1 Frontend (FE)

- Build the SPA interface for login, chatroom management, conversation display, message composition, and notifications.
- Centralize REST contracts in `frontend/src/types/api.ts` and `frontend/src/api/*`.
- Integrate Socket.IO streaming with cumulative chunk semantics.
- Support local HTTPS and PWA/web-push testing flows.
- Maintain unit, component, hook, API contract, and integration tests.

### 5.2 Backend (BE)

- Implement REST APIs, Socket.IO events, validation, authorization, and status codes according to `API_DOCUMENTATION.md`.
- Manage persistence through Prisma and keep migrations aligned with `SCHEMA.md`.
- Integrate Ollama for chat generation, proactive evaluation, and embeddings.
- Manage Qdrant indexing/retrieval for long-term memory.
- Coordinate proactive scheduling, FCM sends, and static asset storage.

### 5.3 Infrastructure

- Maintain Docker Compose definitions for MySQL, Qdrant, backend, and nginx.
- Configure public origins, CORS, asset persistence, model endpoints, and Firebase credentials per environment.
- Maintain CI/CD and deployment runbooks in `.github/ci-cd.md` and `../deploy/README.md`.
