#!/usr/bin/env bash
set -euo pipefail

echo "Deploying Supabase Edge Functions..."
for fn in send-email ringcentral-oauth ringcentral-call ringcentral-sms ringcentral-webhook; do
  echo "  $fn"
  supabase functions deploy "$fn"
done
echo "All Edge Functions deployed."
