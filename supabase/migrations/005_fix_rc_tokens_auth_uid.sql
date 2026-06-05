-- Fix user_rc_tokens: store Supabase auth UUID (not app users.id)
-- Migration 004 used user_id TEXT REFERENCES users(id) but Edge Functions store auth.uid()

DROP TABLE IF EXISTS user_rc_tokens;

CREATE TABLE user_rc_tokens (
  auth_uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rc_account_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  rc_extension_id TEXT,
  rc_phone_number TEXT,
  rc_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_rc_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own RC tokens"
  ON user_rc_tokens FOR SELECT
  USING (auth_uid = auth.uid());

CREATE POLICY "Service role can manage all RC tokens"
  ON user_rc_tokens FOR ALL
  USING (auth.role() = 'service_role');
