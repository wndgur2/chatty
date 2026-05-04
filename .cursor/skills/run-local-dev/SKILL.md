---
name: run-local-dev
description: Starts and validates Chatty local development with docker compose using .env.test, prioritizing frontend and backend quality gates (test, typecheck, lint, build) before runtime checks. Use when the user asks to run local dev, validate frontend/backend, bring up deploy/docker-compose.dev.yml, verify .env.test, or confirm Ollama is running.
---

# Running Local Development Environment

## When to use

Use this skill when the task is to start or validate the local Chatty stack with Docker and `.env.test`.

## Main command

Always use this command from the repository root:

`docker compose -f deploy/docker-compose.dev.yml --env-file .env.test up -d --build`

## Validation workflow (priority-first)

Copy this checklist and update it as you run commands:

```md
Local Dev Validation

- [ ] Validate `.env.test` required keys
- [ ] Validate `/frontend` (test, typecheck, lint, build)
- [ ] Validate `/backend` (test, typecheck, lint, build)
- [ ] Start stack with docker compose
- [ ] Verify containers are healthy/running
- [ ] Validate Ollama is running and model is available
```

### 1) Validate `.env.test`

Confirm these keys exist and are non-empty unless marked optional

### 2) Validate `/frontend` first

Run from `frontend/`:

- `npm run test:unit`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### 3) Validate `/backend` next

Run from `backend/`:

- `npm run test`
- `npm run lint`
- `npm run build`

If a dedicated typecheck script does not exist, `npm run build` is treated as the typecheck gate.

### 4) Start stack

Run:

`docker compose -f deploy/docker-compose.dev.yml --env-file .env.test up -d --build`

### 5) Verify containers

Run:

`docker compose -f deploy/docker-compose.dev.yml --env-file .env.test ps`

Expected:

- `mysql` is `healthy`
- `backend`, `nginx`, `qdrant` are `running`

If not healthy, inspect:

`docker compose -f deploy/docker-compose.dev.yml --env-file .env.test logs --tail=200 backend nginx mysql qdrant`

### 6) Validate Ollama

Host-level check:

`curl -sS http://127.0.0.1:11434/api/tags`

Expected:

- JSON object with `models` list

Container-path check (matches backend path via `host.docker.internal`):

`docker compose -f deploy/docker-compose.dev.yml --env-file .env.test exec backend sh -lc 'curl -sS ${OLLAMA_HOST}/api/tags'`

If the configured chat/eval/embed models are missing, pull them on host:

`ollama pull <model-name>`

## Reporting format

Report results in this order:

1. Compose status (up/failed + unhealthy services)
2. Frontend validation result (test/typecheck/lint/build)
3. Backend validation result (test/typecheck/lint/build)
4. Ollama connectivity/model availability
5. Next action to fix the first blocking issue
