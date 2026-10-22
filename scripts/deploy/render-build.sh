#!/usr/bin/env bash
# Builds one app on Render (see render.yaml): scripts/deploy/render-build.sh api|web|backoffice
set -euo pipefail
cd "$(dirname "$0")/../.."

# Use the pnpm version pinned in package.json, whatever the host has installed.
PNPM_VERSION=$(node -p "require('./package.json').packageManager.split('@')[1]")
pnpm() { npx --yes "pnpm@${PNPM_VERSION}" "$@"; }

case "${1:-}" in
  api)
    pnpm install --frozen-lockfile --filter "@gn/api..."
    pnpm --filter @gn/api exec prisma generate
    pnpm --filter @gn/api build
    ;;
  web)
    pnpm install --frozen-lockfile --filter "@gn/web..."
    # The site reads its pages from the API while building. A free API sleeps when idle, and on the
    # very first deploy it is still building, so wake it and wait for it (up to 10 minutes).
    for i in $(seq 1 60); do
      if curl -fsS --max-time 20 "${API_URL}/health" > /dev/null; then break; fi
      [ "$i" = 60 ] && { echo "The API at ${API_URL} did not answer. Deploy the site again once it is up."; exit 1; }
      echo "Waiting for the API at ${API_URL}..."; sleep 10
    done
    pnpm --filter @gn/web build
    ;;
  backoffice)
    pnpm install --frozen-lockfile --filter "@gn/backoffice..."
    pnpm --filter @gn/backoffice build
    ;;
  *)
    echo "Usage: $0 api|web|backoffice" >&2; exit 2
    ;;
esac
