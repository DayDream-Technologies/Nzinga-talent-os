$ErrorActionPreference = "Stop"
Write-Host "Deploying Supabase Edge Functions..." -ForegroundColor Cyan

$functions = @(
  "send-email",
  "ringcentral-oauth",
  "ringcentral-call",
  "ringcentral-sms",
  "ringcentral-webhook"
)

foreach ($fn in $functions) {
  Write-Host "  $fn"
  supabase functions deploy $fn
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "All Edge Functions deployed." -ForegroundColor Green
