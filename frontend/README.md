# Chatty - Frontend

## Purpose

Chatty is an intelligent, web-based AI Chat application. Unlike traditional AI chatbots that only respond to user input, Chatty features a scheduling algorithm that allows the AI to _voluntarily_ initiate conversations and send messages to users without waiting for user requests.

It provides real-time streaming of messages using local LLMs (via Ollama) and acts as an "Evaluator" to decide if the AI should initiate a chat.

## Frontend Specifications

The frontend architecture prioritizes performance optimization, strict TypeScript implementation, and modular design.

### Tech Stack

- **Core Framework:** React (using Vite)
- **Language:** Strict TypeScript
- **Styling:** Tailwind CSS (with utility libraries like `clsx` and `tailwind-merge` for readability)
- **Data Fetching & State Management:** TanStack Query (React Query)
- **Real-Time Communication:** WebSockets (character-by-character text streaming)
- **Push Notifications:** Firebase Cloud Messaging (Web Push / Service Worker API)

### Key Features

- **Real-time Streamed Responses:** Custom hooks (`useWebSocketStream`) handle incoming chunks of message data in real-time, computing deltas and smoothly updating the UI without entire app re-renders.
- **Voluntary AI Chat & Notifications:** Integration with FCM to deliver push notifications indicating voluntary AI messages using a slow-start check scheduling algorithm.
- **Advanced Chatroom Management:** Support for multiple chatrooms with separate contexts. Users can create, update, delete, clone (copy prompt/image config), and branch (copy history + config) chatrooms.
- **AI Customization:** Users can independently tailor the underlying base prompt and AI profile image for each chatroom environment.

### Architectural Priorities

- **Render Optimization:** Strategic use of state colocation and memoization (`useMemo`, `useCallback`, `React.memo`) to manage massive chat history arrays dynamically.
- **Clean Abstractions:** Complex business logic and API connections are decoupled into centralized, generic custom hooks (`useChatrooms`, `useMessages`, `useNotifications`, etc.).
- **Strict Typing:** All REST endpoints and WebSocket channels are guarded by explicit TypeScript interfaces (`src/types/api.ts`).

## Prerequisites

- **Node.js** (v18+ recommended)
- Running backend API (default local backend URL: `http://localhost:3000`)

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```
2. **Environment Configuration**
   Create `frontend/.env` (optional for local basic usage) and set values as needed:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   VITE_FCM_VAPID_KEY=
   ```
3. **Run Development Server**
   ```bash
   npm run dev
   ```
4. **Build Production Bundle**
   ```bash
   npm run build
   npm run preview
   ```

## Available Scripts

```bash
# Development server
npm run dev

# Type-check + production build
npm run build

# Lint source files
npm run lint

# TypeScript project checks
npm run typecheck

# Run unit/component tests
npm run test
```
