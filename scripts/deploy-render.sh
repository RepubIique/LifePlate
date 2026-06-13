#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RENDER="/opt/homebrew/bin/render"
if [[ ! -x "$RENDER" ]]; then
  RENDER="render"
fi

if ! "$RENDER" whoami --output text >/dev/null 2>&1; then
  echo "Render CLI not logged in. Run: render login"
  exit 1
fi

if [[ ! -f /tmp/lifeplate_database_url.txt ]]; then
  echo "Missing /tmp/lifeplate_database_url.txt (Supabase DATABASE_URL)."
  exit 1
fi

# shellcheck disable=SC1091
set -a
source "$ROOT/apps/api/.env"
set +a

DATABASE_URL="$(cat /tmp/lifeplate_database_url.txt)"

echo "Creating/updating Render service lifeplate-api..."

"$RENDER" services create \
  --confirm \
  --output json \
  --name lifeplate-api \
  --type web_service \
  --repo https://github.com/RepubIique/LifePlate \
  --branch main \
  --runtime docker \
  --plan free \
  --region singapore \
  --health-check-path /health \
  --env-var "DATABASE_URL=${DATABASE_URL}" \
  --env-var "SUPABASE_URL=${SUPABASE_URL}" \
  --env-var "SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}" \
  --env-var "SUPABASE_STORAGE_BUCKET=${SUPABASE_STORAGE_BUCKET:-meals}" \
  --env-var "OPENAI_API_KEY=${OPENAI_API_KEY}" \
  --env-var "OPENAI_MODEL=${OPENAI_MODEL:-gpt-4o-mini}" \
  --env-var "CORS_ORIGIN=*"
