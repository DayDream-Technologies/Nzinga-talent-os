# Apply Supabase Edge Function secrets from .env.secrets in repo root.
# Usage: copy .env.secrets.example → .env.secrets, fill values, then:
#   .\scripts\set-supabase-secrets.ps1              # all secrets
#   .\scripts\set-supabase-secrets.ps1 -MailjetOnly # Mailjet only

param(
  [switch]$MailjetOnly
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$secretsFile = Join-Path $root ".env.secrets"

if (-not (Test-Path $secretsFile)) {
  Write-Error "Missing $secretsFile — copy from .env.secrets.example and fill in values."
}

Get-Content $secretsFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  if ($_ -match '^([^=]+)=(.*)$') {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim()
    Set-Item -Path "env:$name" -Value $value
  }
}

$mailjetKeys = @("MJ_APIKEY_PUBLIC", "MJ_APIKEY_PRIVATE", "MJ_SENDER_EMAIL", "MJ_SENDER_NAME")
$ringcentralKeys = @(
  "RC_CLIENT_ID", "RC_CLIENT_SECRET", "RC_SERVER_URL", "RC_REDIRECT_URI",
  "RC_WEBHOOK_VERIFICATION_TOKEN", "APP_URL"
)

$required = if ($MailjetOnly) { $mailjetKeys } else { $ringcentralKeys + $mailjetKeys }

foreach ($key in $required) {
  $val = [Environment]::GetEnvironmentVariable($key)
  if ([string]::IsNullOrWhiteSpace($val)) {
    Write-Error "Missing required value in .env.secrets: $key"
  }
}

$scope = if ($MailjetOnly) { "Mailjet" } else { "all Edge Function" }
Write-Host "Setting $scope secrets (project must be linked: supabase link)..." -ForegroundColor Cyan

$pairs = @{}
if (-not $MailjetOnly) {
  $pairs["RC_CLIENT_ID"] = $env:RC_CLIENT_ID
  $pairs["RC_CLIENT_SECRET"] = $env:RC_CLIENT_SECRET
  $pairs["RC_SERVER_URL"] = $env:RC_SERVER_URL
  $pairs["RC_REDIRECT_URI"] = $env:RC_REDIRECT_URI
  $pairs["RC_WEBHOOK_VERIFICATION_TOKEN"] = $env:RC_WEBHOOK_VERIFICATION_TOKEN
  $pairs["APP_URL"] = $env:APP_URL
}
$pairs["MJ_APIKEY_PUBLIC"] = $env:MJ_APIKEY_PUBLIC
$pairs["MJ_APIKEY_PRIVATE"] = $env:MJ_APIKEY_PRIVATE
$pairs["MJ_SENDER_EMAIL"] = $env:MJ_SENDER_EMAIL
$pairs["MJ_SENDER_NAME"] = $env:MJ_SENDER_NAME

foreach ($entry in $pairs.GetEnumerator()) {
  Write-Host "  $($entry.Key)"
  supabase secrets set "$($entry.Key)=$($entry.Value)"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Done. Redeploy Edge Functions if already deployed: npm run supabase:deploy" -ForegroundColor Green
