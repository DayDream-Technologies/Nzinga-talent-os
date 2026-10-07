-- DocHub sign requests. The webhook updates these rows; clients only read them.

CREATE TABLE IF NOT EXISTS dochub_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('representation', 'renewal', 'usage')),
  title TEXT NOT NULL DEFAULT '',
  signer_email TEXT NOT NULL,
  signer_name TEXT NOT NULL DEFAULT '',
  talent_account TEXT,
  document_id TEXT,
  sign_request_id TEXT,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'sent', 'viewed', 'signed', 'completed', 'expired', 'voided', 'rejected')
  ),
  expires_at TIMESTAMPTZ,
  last_event_id TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dochub_envelopes_document_id_idx ON dochub_envelopes (document_id);
CREATE INDEX IF NOT EXISTS dochub_envelopes_sign_request_id_idx ON dochub_envelopes (sign_request_id);
CREATE INDEX IF NOT EXISTS dochub_envelopes_signer_email_idx ON dochub_envelopes (lower(signer_email));

ALTER TABLE dochub_envelopes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dochub_envelopes_read ON dochub_envelopes;
CREATE POLICY dochub_envelopes_read ON dochub_envelopes
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid())
    OR lower(signer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

GRANT SELECT ON dochub_envelopes TO authenticated;

-- Inbound event ids. No client policies: service role writes, everyone else is denied.
CREATE TABLE IF NOT EXISTS dochub_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE dochub_webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON dochub_webhook_events FROM anon, authenticated;
