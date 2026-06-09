# Migrate RingCentral webhook from talentmanagerx.com → Supabase Edge Function
#
# Prerequisites:
#   - Edge Function ringcentral-webhook deployed
#   - RC_WEBHOOK_VERIFICATION_TOKEN set in Supabase (cbc0d27c288d694bc2ec339bdbdeb3b3)
#   - RC_ACCESS_TOKEN set (short-lived Bearer from RC OAuth — never commit)
#
# Usage (PowerShell):
#   $env:SUPABASE_PROJECT_REF = "your-ref"
#   $env:RC_ACCESS_TOKEN = "..."   # from RingCentral, NOT the old exposed chat token
#   .\scripts\migrate-ringcentral-webhook.ps1
#
# Optional: set RC_SUBSCRIPTION_ID to PATCH an existing subscription instead of creating new.

$ErrorActionPreference = "Stop"

$projectRef = $env:SUPABASE_PROJECT_REF
$accessToken = $env:RC_ACCESS_TOKEN
$serverUrl = if ($env:RC_SERVER_URL) { $env:RC_SERVER_URL } else { "https://platform.ringcentral.com" }
$verificationToken = if ($env:RC_WEBHOOK_VERIFICATION_TOKEN) { $env:RC_WEBHOOK_VERIFICATION_TOKEN } else { "cbc0d27c288d694bc2ec339bdbdeb3b3" }
$subscriptionId = $env:RC_SUBSCRIPTION_ID

if (-not $projectRef) { Write-Error "Set SUPABASE_PROJECT_REF" }
if (-not $accessToken) { Write-Error "Set RC_ACCESS_TOKEN (RingCentral OAuth Bearer token)" }

$webhookUrl = "https://$projectRef.supabase.co/functions/v1/ringcentral-webhook"
$oldWebhookUrl = "https://talentmanagerx.com/api/webhook"

$body = @{
  eventFilters = @("/restapi/v1.0/account/~/extension/~/telephony/sessions")
  deliveryMode = @{
    transportType = "WebHook"
    address = $webhookUrl
    verificationToken = $verificationToken
  }
} | ConvertTo-Json -Depth 5

$headers = @{
  "accept" = "application/json"
  "content-type" = "application/json"
  "authorization" = "Bearer $accessToken"
}

Write-Host "Target webhook URL: $webhookUrl" -ForegroundColor Cyan
Write-Host "Verification token: $verificationToken" -ForegroundColor Cyan
Write-Host "Retire after success: $oldWebhookUrl" -ForegroundColor Yellow

if ($subscriptionId) {
  Write-Host "PATCH subscription $subscriptionId ..."
  $uri = "$serverUrl/restapi/v1.0/subscription/$subscriptionId"
  $response = Invoke-RestMethod -Method Patch -Uri $uri -Headers $headers -Body $body
} else {
  Write-Host "POST new subscription ..."
  $uri = "$serverUrl/restapi/v1.0/subscription"
  $response = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $body
}

Write-Host "Subscription id: $($response.id)" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. List subscriptions and delete any pointing at $oldWebhookUrl"
Write-Host "  2. Test inbound/outbound call → history rows in Nzinga Talent OS"
Write-Host "  3. Or connect RingCentral in Settings (OAuth auto-creates subscription) and delete duplicates"
