# Chatty frontend

Vite + React 19 SPA for Chatty. The app provides username login, multi-room chat, cumulative Socket.IO AI streaming, chatroom create/edit/clone/branch flows, markdown/math rendering, PWA metadata, and optional Firebase Cloud Messaging (FCM).

For source contracts, use:

- REST and Socket.IO: `../documents/API_DOCUMENTATION.md`
- Backend/runtime setup: `../backend/README.md`
- Docker/deploy setup: `../deploy/README.md`

## Tech stack

- **React 19**, **TypeScript**, **Vite 7**
- **Tailwind CSS 4** (`@tailwindcss/vite`), `clsx`, `tailwind-merge`
- **TanStack Query** for server state
- **Socket.IO client** for realtime chunks and typing state
- **React Router 7** for routing
- **Firebase** (optional) for FCM / web push; **vite-plugin-pwa** for PWA manifest/workbox support
- **react-markdown**, GFM, and KaTeX for AI message rendering
- **Zustand** for lightweight UI/auth state where local state is appropriate
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

If you open the app from your phone via `http://<LAN-IP>:5173`, browsers treat it as insecure and block PWA installability.
Use local HTTPS instead:

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

- **API clients** - `src/api/` centralizes REST calls. All calls are relative to `/api`; the client prepends the configured API origin unless the dev proxy is enabled.
- **Types** - `src/types/api.ts` mirrors the REST response/request shapes from `../documents/API_DOCUMENTATION.md`.
- **Realtime** - `src/features/chatroom/hooks/useWebSocketStream.ts` connects to `/socket.io`, joins the active room, treats `ai_message_chunk.chunk` as cumulative content, and handles `ai_message_complete`.
- **Server state** - TanStack Query manages chatrooms, messages, notification registration, and mutations.
- **Local state** - small Zustand stores handle auth/session and UI modal state.
- **Notifications** - Firebase config is optional; when unset, core chat flows still work without push.

## Testing layout

- **Unit / component / hook tests** — colocated as `src/**/<name>.test.ts(x)`.
- **API contract tests** — `src/api/*.contract.test.ts`.
- **Integration flows** — `tests/integration/*.integration.test.tsx`.
- **Shared helpers** — `src/test/` (fixtures, render helpers).
- **Shared mocks** — `src/test/mocks/` (see `src/test/mocks/README.md`).

## Deployment notes

The production build is served by nginx in the root Docker Compose flow. Build-time `VITE_*` values are passed from the root `.env`; rebuild the nginx/frontend image after changing them. See `../deploy/README.md` for the current Compose services and proxy paths.
