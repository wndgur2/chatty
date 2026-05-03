# Proposal Document: AI Chat app "Chatty"

## 1. Introduction

AI Chatting application "Chatty" is a web-based chat application using an LLM.  
The system allows AI to send messages to users without waiting for user input, based on scheduled triggers.

---

## 2. Objectives

- Provide a chat system powered by an LLM.
- Enable AI to initiate messages based on schedules.
- Support multiple chatrooms with separate contexts.
- Deliver real-time messaging with websocket.

---

## 3. Scope of Work

### 3.1 Core Features

#### 3.1.1 Streamed LLM Responses

- Stream AI responses in real time.
- Maintain continuous message flow during generation.

#### 3.1.2 Proactive AI Messaging

- Trigger AI messages without user input using a slow-start scheduling algorithm:
  - Initializes a 4-second delay after the last message.
  - At the scheduled time, a lightweight "Evaluator" model decides whether to initiate a message.
  - If yes, initiates a proactive message. If no, the delay time is doubled for the next check.
- Use chatroom context for message generation.

#### 3.1.3 Chatrooms

- Support multiple chatrooms per user.
- Store context and message history per chatroom.

---

### 3.2 Detailed Functionalities

#### 3.2.1 Chatroom Management

- Create, retrieve, update, and delete chatrooms.

#### 3.2.2 AI Customization

- Update base prompt per chatroom.
- Update AI profile image per chatroom.

#### 3.2.3 Messaging

- Send messages to AI.
- Receive streamed responses with websocket.

#### 3.2.4 Notifications

- Receive push notifications indicating proactive AI messages using Firebase Cloud Messaging (FCM).

#### 3.2.5 AI Message Metadata

- Store explainability and delivery metadata for AI-authored messages in a dedicated 1:1 metadata record.
- Track read state using `read_at` (nullable datetime) instead of a boolean.
- Track AI delivery type using `delivery_mode` (`reply` or `proactive`).
- Store trigger diagnostics with `trigger_reason` and optional JSON `trigger_context`.

#### 3.2.6 Cloning/branching Chatroom

- Create a new chatroom from an existing one.
- Clone: Copy configuration(prompt, profile-image) only.
- Branch: Copy chat history and configuration.

---

## 4. System Overview

### 4.1 Architecture Summary

- Frontend: Web interface for chat interaction.
- Backend: API, websocket server for chat logic and data handling.
- LLM: Local models via Ollama to generate responses based on context and act as an Evaluator.
- Notification Service: Sends push notifications via Firebase Cloud Messaging (FCM).

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
