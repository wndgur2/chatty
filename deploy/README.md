# Chatty Docker deployment (Compose)

Repository overview and documentation index: [`../README.md`](../README.md).

This guide runs the **development-oriented** full stack from the repository root using **`deploy/docker-compose.dev.yml`**:

- **mysql** — MySQL 8
- **backend** — NestJS (API + Socket.IO) on port 8080 inside the network
- **nginx** — serves the built SPA and proxies `/api`, `/socket.io`, and `/assets` to the backend

Compose file path matters: there is no default `compose.yml` in the repo root, so always pass `-f deploy/docker-compose.dev.yml`.

API and WebSocket contracts: [`../documents/API_DOCUMENTATION.md`](../documents/API_DOCUMENTATION.md).

## Prerequisites

- Docker Engine with the Compose plugin (Docker Desktop, Colima, Linux engine, etc.).
- **Ollama** reachable from the backend container:
  - Default `OLLAMA_HOST` is `http://host.docker.internal:11434`.
  - The Compose file sets `extra_hosts: host.docker.internal:host-gateway` so **Linux** hosts resolve `host.docker.internal` like Docker Desktop on macOS/Windows.
- Models pulled on the machine that runs Ollama, matching `OLLAMA_CHAT_MODEL` and `OLLAMA_EVAL_MODEL` in `deploy/.env`.

## Configure environment

From `/deploy`:

```bash
cp .env.docker.example .env
```

Review and adjust:

- **`JWT_SECRET`** — replace the placeholder for anything beyond local play.
- **`PUBLIC_ORIGIN`** and **`CORS_ORIGIN`** — must match the URL you open in the browser (scheme + host + port).
- **`HTTP_PORT`** — host port mapped to nginx (default **8080**).
- **`OLLAMA_HOST`** — where the backend container reaches Ollama (host gateway vs. LAN IP vs. remote URL).

**Rebuild when build-time inputs change:** `PUBLIC_ORIGIN`, `CORS_ORIGIN`, any `VITE_*` variable, or nginx/Dockerfile changes require a new image build, for example:

```bash
docker compose -f deploy/docker-compose.dev.yml up -d --build
```

## Build and run

```bash
docker compose -f deploy/docker-compose.dev.yml up -d --build
```

Open **`PUBLIC_ORIGIN`** in the browser (default `http://localhost:8080`).

## Smoke test checklist

1. **SPA** — app loads; login works (Firebase-related console noise is OK if web push env is unset).
2. **REST** — login and chatroom list/create via UI hit `/api/...` on the same origin as the page.
3. **WebSocket** — send a message; confirm streaming over Socket.IO (`/socket.io/`).
4. **Profile images** — upload or set image URL; `profileImageUrl` should use your public origin where applicable.
5. **Ollama from backend container:**

   ```bash
   docker compose -f deploy/docker-compose.dev.yml exec backend node -e "const h=(process.env.OLLAMA_HOST||'http://127.0.0.1:11434').replace(/\/$/,'');fetch(h+'/api/tags').then(r=>r.text()).then(console.log).catch(e=>{console.error(e);process.exit(1);})"
   ```

## Troubleshooting

### Prisma failed migration (`P3009`)

If MySQL records a failed migration and the backend exits on `migrate deploy`:

**Option A — reset (destructive):**

```bash
docker compose -f deploy/docker-compose.dev.yml down -v
docker compose -f deploy/docker-compose.dev.yml up -d --build
```

**Option B — resolve a specific migration** (example name from this repo; adjust if your error names another migration):

```bash
docker compose -f deploy/docker-compose.dev.yml exec backend npx prisma migrate resolve --rolled-back 20260408120000_widen_user_device_token
docker compose -f deploy/docker-compose.dev.yml restart backend
```

### Origin / port mismatches

Symptoms: API or WebSocket failures, wrong host in image URLs. Align **`PUBLIC_ORIGIN`**, **`CORS_ORIGIN`**, **`HTTP_PORT`**, and the browser URL, then rebuild.

## CI/CD

- GitHub **CD** builds and pushes images (see `.github/workflows/cd.yml`); images use commit-SHA tags in GHCR.
- Server deploy uses **`deploy/docker-compose.prod.yml`** and **`deploy/scripts/deploy-prod.sh`** (copied or referenced per your ops runbook).
- Required secrets, host layout, and health checks are documented in **`documents/ci-cd.md`**.

### CD reliability model

- Production CD currently targets **ARM64** images to match the production host architecture and avoid emulation instability.
- Build jobs are cancelable so newer commits replace older queued builds.
- Deploy jobs are serialized and non-cancelable, and include a stale-run guard so only the latest `main` commit proceeds to remote deployment.

## Operations

- Uploaded files persist in the Docker volume **`backend_assets`** (`ASSETS_DIR=/app/assets` in the backend service).
- For HTTPS or a custom domain, terminate TLS at the edge (e.g. nginx or a reverse proxy) and set **`PUBLIC_ORIGIN`** / **`CORS_ORIGIN`** to the public HTTPS URL.
