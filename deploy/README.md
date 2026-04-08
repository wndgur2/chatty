# Chatty Docker deployment (macOS-oriented)

Stack: **MySQL**, **Nest backend**, **nginx** (static SPA + reverse proxy to API, `/socket.io`, and `/assets`).

## Prerequisites

- Docker Desktop for Mac (or compatible engine).
- **Ollama** running on the Mac host (recommended) so the backend can call `http://host.docker.internal:11434`. Pull the models you configure in `OLLAMA_*`.

## Quick start

1. Copy env template and edit secrets:

   ```bash
   cp .env.docker.example .env
   ```

2. The default published port is **8080** (`HTTP_PORT=8080`). If you change the port or hostname, set `PUBLIC_ORIGIN` and `CORS_ORIGIN` to the URL you open in the browser (for example `http://127.0.0.1:3000` and `HTTP_PORT=3000`). Rebuild nginx after changing `PUBLIC_*` or `VITE_*` vars (they are compile-time for the SPA).

3. Build and run:

   ```bash
   docker compose up --build
   ```

4. Open `PUBLIC_ORIGIN` in the browser (default `http://localhost:8080`).

## Smoke tests

1. **SPA**: Load the app; confirm the login/register UI renders without console errors (except optional Firebase warnings if keys are unset).
2. **REST**: Register, log in, list or create chatrooms via the UI (all traffic should go to `/api/...` on the same host).
3. **WebSocket**: Open a chatroom and send a message; confirm streaming works (Network tab → WS to `/socket.io/`).
4. **Profile image URL**: Create or update a chatroom with an image; the returned `profileImageUrl` should use your public origin (`http://localhost:8080` or your custom `PUBLIC_ORIGIN`), not an internal Docker hostname.
5. **Ollama from the backend container** (Node 18+ global `fetch`):

   ```bash
   docker compose exec backend node -e "const h=(process.env.OLLAMA_HOST||'http://127.0.0.1:11434').replace(/\/$/,'');fetch(h+'/api/tags').then(r=>r.text()).then(console.log).catch(e=>{console.error(e);process.exit(1);})"
   ```

## Troubleshooting

### P3009 — failed migration (e.g. old `widen_user_device_token`)

If the DB still has a **failed** row for a migration (from an earlier run) and the backend exits on `migrate deploy`, either:

**A. Reset the database** (drops all data):

```bash
docker compose down -v
docker compose up --build
```

**B. Mark the failed migration as rolled back**, then restart the backend (entrypoint runs `migrate deploy` again):

```bash
docker compose exec backend npx prisma migrate resolve --rolled-back 20260408120000_widen_user_device_token
docker compose restart backend
```

## Notes

- Uploaded files persist in the `backend_assets` volume (`ASSETS_DIR=/app/assets`).
- `extra_hosts: host.docker.internal:host-gateway` helps on Linux; on Docker Desktop for Mac it is redundant but harmless.
- For HTTPS or a custom domain, terminate TLS at nginx (add certs and a `listen 443 ssl` server block) and set `PUBLIC_ORIGIN` / `CORS_ORIGIN` to `https://your.domain`.
