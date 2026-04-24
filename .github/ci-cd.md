# Chatty CI/CD Operations Guide

This document describes the GitHub settings required for:

- `.github/workflows/ci.yml`
- `.github/workflows/cd.yml`
- `.github/workflows/git-convention.yml`

## 1) Repository and package settings

1. In GitHub repository settings, set **Actions > General > Workflow permissions** to **Read and write permissions**.
2. In **Packages**, keep `chatty-backend` and `chatty-nginx` private unless public images are required.
3. If this repository is under an organization, ensure org package policies allow this repository to publish and read GHCR packages.

## 2) Production environment settings

Create a GitHub environment named `production` and configure:

- **Required reviewers**: at least 1 reviewer (recommended).
- **Wait timer**: optional (recommended 5 minutes).
- **Deployment branch policy**: `main` only.

Add these `production` environment secrets:

- `DEPLOY_HOST`: SSH host (example: `app.example.com`).
- `DEPLOY_USER`: SSH user with Docker access.
- `DEPLOY_PATH`: absolute deploy directory on server (example: `/opt/chatty`).
- `DEPLOY_SSH_KEY`: private key matching an authorized key on deploy host.
- `GHCR_USERNAME`: GitHub username or bot account that can pull GHCR images.
- `GHCR_TOKEN`: PAT with `read:packages` (and `repo` if package ACL needs it).
- `PROD_HEALTHCHECK_URL`: health endpoint checked after deploy.

## 3) Production host requirements

On the server at `DEPLOY_PATH`:

1. Place `deploy/docker-compose.prod.yml` and `deploy/scripts/deploy-prod.sh` (workflow copies these on each deploy).
2. Create an `.env` file with runtime settings:
   - `MYSQL_ROOT_PASSWORD`
   - `MYSQL_DATABASE`
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `PUBLIC_ORIGIN`
   - `CORS_ORIGIN`
   - `OLLAMA_HOST`
   - `OLLAMA_CHAT_MODEL`
   - `OLLAMA_EVAL_MODEL`
   - `HTTP_PORT` (optional, default `8080`)
3. Install Docker Engine with Compose plugin.

## 4) Branch protection policy

Apply branch protection rules:

- **Branch**: `main`
  - Require a pull request before merging.
  - Require status checks to pass before merging:
    - `verify-commits`
    - `backend-checks`
    - `frontend-checks`
  - Disable direct pushes (except admin bypass policy if needed).
  - Require linear history (recommended with squash merge).

- **Branch**: `develop`
  - Require status checks:
    - `verify-commits`
    - `backend-checks`
    - `frontend-checks`

## 5) Rollout sequence

1. Enable `ci.yml` and verify runtime/caching on a feature branch PR.
2. Enable branch protection required checks.
3. Add production environment secrets and protections.
4. Run first deploy with `cd.yml` and confirm health check succeeds.
5. Observe 1-2 weeks, then tune path filters or split tests to reduce CI time.

## 6) CD reliability model

Production CD is tuned for safe, deterministic deploys on ARM infrastructure.

- **Build scope**: `cd.yml` builds and publishes ARM64 images for production.
- **Build concurrency**: `build-and-push` uses cancel-in-progress behavior so older queued builds are dropped when newer commits arrive.
- **Deploy concurrency**: `deploy-production` is serialized and non-cancelable to avoid interrupted in-flight deploys.
- **Stale-run guard**: deploy steps run only when the workflow SHA still matches the latest `main` head, so outdated runs do not deploy.
