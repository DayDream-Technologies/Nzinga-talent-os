#!/usr/bin/env bash
# Migrate RingCentral webhook from talentmanagerx.com → Supabase Edge Function
set -euo pipefail

: "${SUPABASE_PROJECT_REF:?Set SUPABASE_PROJECT_REF}"
: "${RC_ACCESS_TOKEN:?Set RC_ACCESS_TOKEN (RingCentral OAuth Bearer — never commit)}"

RC_SERVER_URL="${RC_SERVER_URL:-https://platform.ringcentral.com}"
RC_WEBHOOK_VERIFICATION_TOKEN="${RC_WEBHOOK_VERIFICATION_TOKEN:-cbc0d27c288d694bc2ec339bdbdeb3b3}"
WEBHOOK_URL="https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/ringcentral-webhook"
OLD_WEBHOOK_URL="https://talentmanagerx.com/api/webhook"

BODY=$(cat <<EOF
{
  "eventFilters": ["/restapi/v1.0/account/~/extension/~/telephony/sessions"],
  "deliveryMode": {
    "transportType": "WebHook",
    "address": "${WEBHOOK_URL}",
    "verificationToken": "${RC_WEBHOOK_VERIFICATION_TOKEN}"
  }
}
EOF
)

echo "Target webhook URL: ${WEBHOOK_URL}"
echo "Retire after success: ${OLD_WEBHOOK_URL}"

if [[ -n "${RC_SUBSCRIPTION_ID:-}" ]]; then
  echo "PATCH subscription ${RC_SUBSCRIPTION_ID} ..."
  curl --request PATCH \
    --url "${RC_SERVER_URL}/restapi/v1.0/subscription/${RC_SUBSCRIPTION_ID}" \
    --header "accept: application/json" \
    --header "authorization: Bearer ${RC_ACCESS_TOKEN}" \
    --header "content-type: application/json" \
    --data "${BODY}"
else
  echo "POST new subscription ..."
  curl --request POST \
    --url "${RC_SERVER_URL}/restapi/v1.0/subscription" \
    --header "accept: application/json" \
    --header "authorization: Bearer ${RC_ACCESS_TOKEN}" \
    --header "content-type: application/json" \
    --data "${BODY}"
fi

echo ""
echo "Next: delete old subscription at ${OLD_WEBHOOK_URL} via RC API or developer console."
