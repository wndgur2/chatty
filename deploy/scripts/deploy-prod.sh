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

cd "${DEPLOY_PATH}"

if [ ! -f ".env" ]; then
  echo "Missing ${DEPLOY_PATH}/.env. Create it before first deploy."
  exit 1
fi

echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin
docker pull "${BACKEND_IMAGE}:${IMAGE_TAG}"
docker pull "${NGINX_IMAGE}:${IMAGE_TAG}"

BACKEND_IMAGE="${BACKEND_IMAGE}" \
NGINX_IMAGE="${NGINX_IMAGE}" \
IMAGE_TAG="${IMAGE_TAG}" \
docker compose --env-file .env -f docker-compose.prod.yml up -d

docker image prune -f >/dev/null 2>&1 || true
echo "Deployment completed with image tag ${IMAGE_TAG}."
