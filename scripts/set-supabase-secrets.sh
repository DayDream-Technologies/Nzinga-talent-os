#!/usr/bin/env bash
# Apply Supabase Edge Function secrets from .env.secrets in repo root.
# Usage:
#   ./scripts/set-supabase-secrets.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS_FILE="$ROOT/.env.secrets"

if [[ ! -f "$SECRETS_FILE" ]]; then
  echo "Missing $SECRETS_FILE — copy from .env.secrets.example and fill in values." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$SECRETS_FILE"
set +a

required=(
  RC_CLIENT_ID RC_CLIENT_SECRET RC_SERVER_URL RC_REDIRECT_URI
  RC_WEBHOOK_VERIFICATION_TOKEN APP_URL
)

for key in "${required[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "Missing required value in .env.secrets: $key" >&2
    exit 1
  fi
done

echo "Setting Edge Function secrets (project must be linked: supabase link)..."
supabase secrets set \
  "RC_CLIENT_ID=$RC_CLIENT_ID" \
  "RC_CLIENT_SECRET=$RC_CLIENT_SECRET" \
  "RC_SERVER_URL=$RC_SERVER_URL" \
  "RC_REDIRECT_URI=$RC_REDIRECT_URI" \
  "RC_WEBHOOK_VERIFICATION_TOKEN=$RC_WEBHOOK_VERIFICATION_TOKEN" \
  "APP_URL=$APP_URL"

echo "Done. Redeploy Edge Functions if already deployed: npm run supabase:deploy"
