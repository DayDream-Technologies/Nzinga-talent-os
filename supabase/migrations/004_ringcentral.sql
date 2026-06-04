-- RingCentral integration: user token storage and enhanced history fields

-- Store per-user RingCentral OAuth tokens
CREATE TABLE user_rc_tokens (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  rc_account_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  rc_extension_id TEXT,
  rc_phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add 'sms' to history_type enum
ALTER TYPE history_type ADD VALUE IF NOT EXISTS 'sms';

-- Add telephony fields to history table
ALTER TABLE history ADD COLUMN IF NOT EXISTS call_duration_seconds INT;
ALTER TABLE history ADD COLUMN IF NOT EXISTS call_recording_url TEXT;
ALTER TABLE history ADD COLUMN IF NOT EXISTS call_direction TEXT;
ALTER TABLE history ADD COLUMN IF NOT EXISTS sms_direction TEXT;
ALTER TABLE history ADD COLUMN IF NOT EXISTS email_subject TEXT;
ALTER TABLE history ADD COLUMN IF NOT EXISTS email_to TEXT;

-- Index for matching inbound calls to talent records by phone
CREATE INDEX IF NOT EXISTS idx_talents_phone ON talents(phone) WHERE phone IS NOT NULL AND phone != '';

-- RLS policies for user_rc_tokens
ALTER TABLE user_rc_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own RC tokens"
  ON user_rc_tokens FOR SELECT
  USING (user_id = (SELECT id FROM users WHERE auth_uid = auth.uid()));

CREATE POLICY "Service role can manage all RC tokens"
  ON user_rc_tokens FOR ALL
  USING (auth.role() = 'service_role');
