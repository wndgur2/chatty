#!/usr/bin/env sh
set -eu

if [ -z "${DEPLOY_PATH:-}" ]; then
  echo "DEPLOY_PATH is required."
  exit 1
fi

if [ -z "${GHCR_USERNAME:-}" ] || [ -z "${GHCR_TOKEN:-}" ]; then
  echo "GHCR_USERNAME and GHCR_TOKEN are required."
  exit 1
fi

if [ -z "${BACKEND_IMAGE:-}" ] || [ -z "${NGINX_IMAGE:-}" ] || [ -z "${IMAGE_TAG:-}" ]; then
  echo "BACKEND_IMAGE, NGINX_IMAGE, and IMAGE_TAG are required."
  exit 1
fi

# Non-interactive SSH shells often have a minimal PATH.
PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:${PATH:-}"
export PATH

DOCKER_BIN="${DOCKER_BIN:-docker}"
if ! command -v "${DOCKER_BIN}" >/dev/null 2>&1; then
  for candidate in /usr/bin/docker /usr/local/bin/docker /opt/homebrew/bin/docker; do
    if [ -x "${candidate}" ]; then
      DOCKER_BIN="${candidate}"
      break
    fi
  done
fi

if ! command -v "${DOCKER_BIN}" >/dev/null 2>&1; then
  echo "Docker CLI not found in PATH (${PATH}). Set DOCKER_BIN or fix remote shell PATH."
  exit 1
fi

cd "${DEPLOY_PATH}"

if [ ! -f ".env" ]; then
  echo "Missing ${DEPLOY_PATH}/.env. Create it before first deploy."
  exit 1
fi

echo "${GHCR_TOKEN}" | "${DOCKER_BIN}" login ghcr.io -u "${GHCR_USERNAME}" --password-stdin
"${DOCKER_BIN}" pull "${BACKEND_IMAGE}:${IMAGE_TAG}"
"${DOCKER_BIN}" pull "${NGINX_IMAGE}:${IMAGE_TAG}"

BACKEND_IMAGE="${BACKEND_IMAGE}" \
NGINX_IMAGE="${NGINX_IMAGE}" \
IMAGE_TAG="${IMAGE_TAG}" \
"${DOCKER_BIN}" compose --env-file .env -f docker-compose.prod.yml up -d

"${DOCKER_BIN}" image prune -f >/dev/null 2>&1 || true
echo "Deployment completed with image tag ${IMAGE_TAG}."
