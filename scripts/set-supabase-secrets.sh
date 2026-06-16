#!/usr/bin/env bash
# Apply Supabase Edge Function secrets from .env.secrets in repo root.
# Usage:
#   ./scripts/set-supabase-secrets.sh              # all secrets
#   ./scripts/set-supabase-secrets.sh --mailjet-only
set -euo pipefail

MAILJET_ONLY=false
if [[ "${1:-}" == "--mailjet-only" ]]; then
  MAILJET_ONLY=true
fi

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

mailjet_keys=(MJ_APIKEY_PUBLIC MJ_APIKEY_PRIVATE MJ_SENDER_EMAIL MJ_SENDER_NAME)
ringcentral_keys=(
  RC_CLIENT_ID RC_CLIENT_SECRET RC_SERVER_URL RC_REDIRECT_URI
  RC_WEBHOOK_VERIFICATION_TOKEN APP_URL
)

if [[ "$MAILJET_ONLY" == true ]]; then
  required=("${mailjet_keys[@]}")
else
  required=("${ringcentral_keys[@]}" "${mailjet_keys[@]}")
fi

for key in "${required[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "Missing required value in .env.secrets: $key" >&2
    exit 1
  fi
done

if [[ "$MAILJET_ONLY" == true ]]; then
  echo "Setting Mailjet secrets (project must be linked: supabase link)..."
  supabase secrets set \
    "MJ_APIKEY_PUBLIC=$MJ_APIKEY_PUBLIC" \
    "MJ_APIKEY_PRIVATE=$MJ_APIKEY_PRIVATE" \
    "MJ_SENDER_EMAIL=$MJ_SENDER_EMAIL" \
    "MJ_SENDER_NAME=$MJ_SENDER_NAME"
else
  echo "Setting all Edge Function secrets (project must be linked: supabase link)..."
  supabase secrets set \
    "RC_CLIENT_ID=$RC_CLIENT_ID" \
    "RC_CLIENT_SECRET=$RC_CLIENT_SECRET" \
    "RC_SERVER_URL=$RC_SERVER_URL" \
    "RC_REDIRECT_URI=$RC_REDIRECT_URI" \
    "RC_WEBHOOK_VERIFICATION_TOKEN=$RC_WEBHOOK_VERIFICATION_TOKEN" \
    "APP_URL=$APP_URL" \
    "MJ_APIKEY_PUBLIC=$MJ_APIKEY_PUBLIC" \
    "MJ_APIKEY_PRIVATE=$MJ_APIKEY_PRIVATE" \
    "MJ_SENDER_EMAIL=$MJ_SENDER_EMAIL" \
    "MJ_SENDER_NAME=$MJ_SENDER_NAME"
fi

echo "Done. Redeploy Edge Functions if already deployed: npm run supabase:deploy"
