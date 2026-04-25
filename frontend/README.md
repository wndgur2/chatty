# Chatty frontend

Vite + React 19 SPA for multi-room chat, Socket.IO streaming, optional web push (FCM), and chatroom management (create, edit, clone, branch).

## Purpose

Chatty supports both user-initiated messages and **proactive** AI messages: the backend runs evaluations on a schedule; the UI reflects streaming replies and can surface push notifications when Firebase is configured.

## Tech stack

- **React 19**, **TypeScript**, **Vite 7**
- **Tailwind CSS 4** (`@tailwindcss/vite`), `clsx`, `tailwind-merge`
- **TanStack Query** for server state
- **Socket.IO client** for realtime chunks and typing state
- **React Router 7** for routing
- **Firebase** (optional) for FCM / web push; **vite-plugin-pwa** for the service worker shell
- **Vitest** + Testing Library for tests

## Prerequisites

- Node.js 18+
- Running Chatty backend (default in this repo: **`http://localhost:8080`** — set `VITE_API_URL` to match)

## Getting started

```bash
npm install
cp .env.example .env
```

Edit `.env`:

- **`VITE_API_URL`** — backend origin, **no trailing slash** (e.g. `http://localhost:8080` for local Nest with default `PORT`).
- **Firebase / `VITE_FCM_VAPID_KEY`** — optional; omit for local UI flows without push.

```bash
npm run dev
```

Production build and preview:

```bash
npm run build
npm run preview
```

## Environment variables

| Variable                                    | Purpose                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| `VITE_API_URL`                              | REST + Socket.IO base (same host/path the browser uses to reach the API). |
| `VITE_FIREBASE_*`                           | Firebase web app config for FCM.                                          |
| `VITE_FCM_VAPID_KEY`                        | Web Push VAPID key from Firebase Console.                                 |
| `VITE_RELEASE_SHA`, `VITE_RELEASE_BUILT_AT` | Optional build metadata (e.g. CI).                                        |

## Scripts

```bash
npm run dev                 # Vite dev server (--host)
npm run build               # tsc -b && vite build
npm run preview             # Preview production build
npm run lint                # ESLint
npm run typecheck           # TypeScript project references
npm run test                # Vitest run (all configured tests)
npm run test:unit           # Under src/
npm run test:integration    # tests/integration/
npm run test:ui             # Vitest UI
npm run test:coverage       # Coverage report
npm run test:coverage:enforce  # Coverage with enforcement flag
```

## Architecture notes

- **Hooks** — data and side effects are grouped in hooks such as chatrooms, messages, notifications, and websocket streaming (deltas for partial AI text).
- **Types** — REST shapes and enums are centralized (e.g. `src/types/api.ts`) to stay aligned with the backend contract.
- **State** — TanStack Query for remote data; lightweight client state where appropriate (e.g. Zustand where used).

## Testing layout

- **Unit / component / hook tests** — colocated as `src/**/<name>.test.ts(x)`.
- **API contract tests** — `src/api/*.contract.test.ts`.
- **Integration flows** — `tests/integration/*.integration.test.tsx`.
- **Shared helpers** — `src/test/` (fixtures, render helpers).
- **Shared mocks** — `src/test/mocks/` (see `src/test/mocks/README.md`).
