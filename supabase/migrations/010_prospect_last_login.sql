-- Track last portal login for prospect / talent accounts
ALTER TABLE prospect_profiles
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_prospect_profiles_last_login
  ON prospect_profiles (last_login_at DESC NULLS LAST);
