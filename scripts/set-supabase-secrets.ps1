# Apply Supabase Edge Function secrets from .env.secrets in repo root.
# Usage: copy .env.secrets.example → .env.secrets, fill values, then:
#   .\scripts\set-supabase-secrets.ps1

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

$required = @(
  "RC_CLIENT_ID", "RC_CLIENT_SECRET", "RC_SERVER_URL", "RC_REDIRECT_URI",
  "RC_WEBHOOK_VERIFICATION_TOKEN", "APP_URL"
)

foreach ($key in $required) {
  $val = [Environment]::GetEnvironmentVariable($key)
  if ([string]::IsNullOrWhiteSpace($val)) {
    Write-Error "Missing required value in .env.secrets: $key"
  }
}

Write-Host "Setting Edge Function secrets (project must be linked: supabase link)..." -ForegroundColor Cyan

$pairs = @{
  "RC_CLIENT_ID" = $env:RC_CLIENT_ID
  "RC_CLIENT_SECRET" = $env:RC_CLIENT_SECRET
  "RC_SERVER_URL" = $env:RC_SERVER_URL
  "RC_REDIRECT_URI" = $env:RC_REDIRECT_URI
  "RC_WEBHOOK_VERIFICATION_TOKEN" = $env:RC_WEBHOOK_VERIFICATION_TOKEN
  "APP_URL" = $env:APP_URL
}

$optional = @(
  "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "S3_BUCKET", "CDN_URL",
  "RESEND_API_KEY", "EMAIL_FROM_ADDRESS", "EMAIL_FROM_NAME"
)
foreach ($key in $optional) {
  $val = [Environment]::GetEnvironmentVariable($key)
  if (-not [string]::IsNullOrWhiteSpace($val)) {
    $pairs[$key] = $val
  }
}

foreach ($entry in $pairs.GetEnumerator()) {
  Write-Host "  $($entry.Key)"
  supabase secrets set "$($entry.Key)=$($entry.Value)"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Done. Redeploy Edge Functions if already deployed: npm run supabase:deploy" -ForegroundColor Green
