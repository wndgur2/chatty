# Chatty frontend

Vite + React 19 SPA for multi-room chat, Socket.IO streaming, optional web push (FCM), and chatroom management (create, edit, clone, branch).

**Also read:** repository overview [`../README.md`](../README.md); API and WebSocket contract [`../documents/API_DOCUMENTATION.md`](../documents/API_DOCUMENTATION.md).

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
- **`VITE_DEV_PROXY_TARGET`** — optional dev-only proxy target to avoid CORS (e.g. `http://127.0.0.1:8081`).
- **Firebase / `VITE_FCM_VAPID_KEY`** — optional; omit for local UI flows without push.

```bash
npm run dev
```

## Local HTTPS for mobile PWA testing

If you open the app from your phone via `http://<LAN-IP>:5173`, browsers treat it as insecure and block PWA installability. Use local HTTPS instead:

1. Install `mkcert` and its local CA on your Mac:

```bash
brew install mkcert
mkcert -install
```

2. Create certs in `frontend/certs` (replace `<LAN-IP>` with your machine IP, for example `192.168.0.12`):

```bash
mkdir -p certs
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1 <LAN-IP>
```

3. Run Vite with HTTPS:

```bash
npm run dev:https
```

4. Open from mobile:

```text
https://<LAN-IP>:5173
```

Optional `.env` overrides if your cert files live elsewhere:

```bash
VITE_HTTPS=true
VITE_HTTPS_CERT=./path/to/cert.pem
VITE_HTTPS_KEY=./path/to/key.pem
```

For Cloudflare tunnel + mobile testing, you can also route API and Socket.IO through Vite to avoid backend CORS:

```bash
VITE_DEV_PROXY_TARGET=http://127.0.0.1:8081
```

When this is set in dev mode, frontend uses same-origin `/api` and `/socket.io`, and Vite proxies to the backend target.

Production build and preview:

```bash
npm run build
npm run preview
```

## Environment variables

| Variable                                    | Purpose                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| `VITE_API_URL`                              | REST + Socket.IO base (same host/path the browser uses to reach the API). |
| `VITE_DEV_PROXY_TARGET`                     | Optional dev-only backend proxy target for `/api` and `/socket.io` to avoid CORS. |
| `VITE_FIREBASE_*`                           | Firebase web app config for FCM.                                          |
| `VITE_FCM_VAPID_KEY`                        | Web Push VAPID key from Firebase Console.                                 |
| `VITE_HTTPS`                                | Set `true` to enable local HTTPS in Vite dev server.                      |
| `VITE_HTTPS_CERT`, `VITE_HTTPS_KEY`         | Optional cert/key paths (defaults to `./certs/localhost.pem` and `./certs/localhost-key.pem`). |
| `VITE_RELEASE_SHA`, `VITE_RELEASE_BUILT_AT` | Optional build metadata (e.g. CI).                                        |

## Scripts

```bash
npm run dev                 # Vite dev server (--host)
npm run dev:https           # Vite dev server with local HTTPS cert/key
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
