# Proposal Document: AI Chat app "Chatty"

For implementation-level contracts, use [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) for REST/Socket.IO behavior and [`SCHEMA.md`](SCHEMA.md) for the MySQL/Prisma model. This document keeps the product and system scope concise.

## 1. Introduction

Chatty is a web-based AI chat application. It supports normal user-initiated conversations and proactive AI messages that are generated after scheduled backend evaluations.

---

## 2. Objectives

- Provide a chat system powered by an LLM.
- Enable AI to initiate messages based on schedules.
- Support multiple chatrooms with separate contexts.
- Deliver real-time streamed messaging with Socket.IO.
- Preserve long-term conversational memory through vector retrieval.

---

## 3. Scope of Work

### 3.1 Core Features

#### 3.1.1 Streamed LLM Responses

- Stream AI responses in real time over Socket.IO.
- Maintain continuous message flow during generation.

#### 3.1.2 Proactive AI Messaging

- Trigger AI messages without user input using a slow-start scheduling algorithm:
  - Initializes a 4-second delay after the last message.
  - At the scheduled time, a lightweight "Evaluator" model decides whether to initiate a message.
  - If yes, initiates a proactive message. If no, the delay time is doubled for the next check.
  - The scheduler runs on a cron cadence and caps consecutive "no send" growth in backend scheduling constants.
- Use chatroom context for message generation.

#### 3.1.3 Chatrooms

- Support multiple chatrooms per user.
- Store context and message history per chatroom.

#### 3.1.4 Long-term memory (implementation)

- Vector retrieval augments prompts with relevant past snippets (RAG).
- Qdrant stores embeddings; Ollama provides chat, evaluator, and embedding models.
- Recent messages are excluded from retrieval by ID and older messages are semantically chunked before embedding.
- Operator-facing configuration is summarized in [`../backend/README.md`](../backend/README.md).

---

### 3.2 Detailed Functionalities

#### 3.2.1 Chatroom Management

- Create, retrieve, update, and delete chatrooms.

#### 3.2.2 AI Customization

- Update base prompt per chatroom.
- Update AI profile image per chatroom.

#### 3.2.3 Messaging

- Send messages to AI.
- Receive streamed responses with Socket.IO events.

#### 3.2.4 Notifications

- Receive push notifications indicating proactive AI messages using Firebase Cloud Messaging (FCM).

#### 3.2.5 AI Message Metadata

- Store explainability and delivery metadata for AI-authored messages in a dedicated 1:1 metadata record.
- Track read state using `read_at` (nullable datetime) instead of a boolean.
- Track AI delivery type using `delivery_mode` (`reply` or `proactive`).
- Store trigger diagnostics with `trigger_reason` and optional JSON `trigger_context`.

#### 3.2.6 Cloning/branching Chatroom

- Create a new chatroom from an existing one.
- Clone: Copy configuration (prompt, profile-image) only.
- Branch: Copy chat history and configuration.

---

## 4. System Overview

### 4.1 Architecture Summary

- Frontend: Web interface for chat interaction.
- Backend: API, websocket server for chat logic and data handling.
- LLM: Local models via Ollama to generate responses based on context and act as an evaluator.
- Vector store: Qdrant for retrieved memory snippets.
- Database: MySQL accessed through Prisma.
- Notification Service: Sends push notifications via Firebase Cloud Messaging (FCM).

The deployed/local stack is documented in [`../README.md`](../README.md) and [`../deploy/README.md`](../deploy/README.md).

---

## 5. Roles and Responsibilities

### 5.1 Frontend (FE)

- Develop web application interface.
- Integrate push notification handling on client side.
- Perform frontend testing (UI and interaction).
- Conduct end-to-end (E2E) testing across the system.

### 5.2 Backend (BE)

- Develop APIs.
- Implement scheduler for AI-initiated messaging.
- Integrate local LLM via Ollama for response generation and evaluation.
- Manage data storage using MySQL.
- Perform backend testing (API and logic).

### 5.3 Infrastructure

- Set up CI/CD pipelines.
- Manage deployment environments.
- Configure and maintain Docker containers.
