# Chatty Docker deployment (macOS-oriented)

This guide runs Chatty with Docker Compose using:

- `mysql`: MySQL 8
- `backend`: NestJS API + WebSocket server
- `nginx`: serves built frontend and proxies `/api`, `/socket.io`, and `/assets`

## 1) Prerequisites

- Docker Desktop for Mac (or another compatible Docker engine).
- Ollama running on the host machine so containers can reach `http://host.docker.internal:11434`.
- Required Ollama models pulled locally (`OLLAMA_CHAT_MODEL`, `OLLAMA_EVAL_MODEL`).

## 2) Configure environment

From the project root:

```bash
cp .env.docker.example .env
```

Update values in `.env` before first run:

- `JWT_SECRET` should be changed from the default placeholder.
- `PUBLIC_ORIGIN` and `CORS_ORIGIN` should match the browser URL you will use.
- `HTTP_PORT` controls host port mapping for nginx (default `8080`).
- `OLLAMA_HOST` defaults to `http://host.docker.internal:11434` for local Ollama on macOS.

Important behavior notes:

- If you change `PUBLIC_*` or any `VITE_*` variable, rebuild with `docker compose up --build` because frontend values are compile-time.
- If you expose a different host/port (example: `http://127.0.0.1:3000`), align `PUBLIC_ORIGIN`, `CORS_ORIGIN`, and `HTTP_PORT`.

## 3) Build and run

From the project root:

```bash
docker compose up --build
```

Then open `PUBLIC_ORIGIN` in your browser (default `http://localhost:8080`).

## 4) Smoke test checklist

1. **SPA**: app loads and login UI renders (optional Firebase warnings are acceptable when Firebase vars are unset).
2. **REST**: login and list/create chatrooms through UI; requests should target `/api/...` on the same host.
3. **WebSocket**: send a message in a chatroom and confirm streaming via Socket.IO (`/socket.io/`).
4. **Profile image URL**: create/update chatroom with image and verify returned `profileImageUrl` uses your public origin.
5. **Ollama reachability from backend container**:

   ```bash
   docker compose exec backend node -e "const h=(process.env.OLLAMA_HOST||'http://127.0.0.1:11434').replace(/\/$/,'');fetch(h+'/api/tags').then(r=>r.text()).then(console.log).catch(e=>{console.error(e);process.exit(1);})"
   ```

## 5) Troubleshooting

### Prisma `P3009` failed migration (example: `widen_user_device_token`)

If MySQL contains a failed migration row from an earlier attempt and backend exits during `migrate deploy`:

Option A: reset database state (destructive; drops all DB data):

```bash
docker compose down -v
docker compose up --build
```

Option B: mark migration as rolled back, then restart backend:

```bash
docker compose exec backend npx prisma migrate resolve --rolled-back 20260408120000_widen_user_device_token
docker compose restart backend
```

### Common origin/port mismatch symptoms

- Browser cannot call API or WebSocket correctly.
- Profile image URLs point to an unexpected host.

Verify these values are aligned: `PUBLIC_ORIGIN`, `CORS_ORIGIN`, `HTTP_PORT`, and browser URL.

## 6) Operational notes

- Uploaded files persist in Docker volume `backend_assets` (`ASSETS_DIR=/app/assets`).
- `extra_hosts: host.docker.internal:host-gateway` is mainly for Linux compatibility; harmless on Docker Desktop for Mac.
- For custom domain or HTTPS, terminate TLS at nginx and set `PUBLIC_ORIGIN` / `CORS_ORIGIN` to the final HTTPS URL.
