-- Guardian verification for minor applications + document metadata + application guardian fields

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS guardian_status text DEFAULT 'not_required'
    CHECK (guardian_status IN ('not_required', 'pending', 'completed')),
  ADD COLUMN IF NOT EXISTS guardian_email text;

CREATE TABLE IF NOT EXISTS guardian_invites (
  id text PRIMARY KEY,
  application_id text NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  guardian_email text NOT NULL,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'expired')),
  invited_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_guardian_invites_app ON guardian_invites(application_id);
CREATE INDEX IF NOT EXISTS idx_guardian_invites_token ON guardian_invites(token);

CREATE TABLE IF NOT EXISTS guardian_profiles (
  application_id text PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  auth_uid uuid,
  email text NOT NULL,
  name text NOT NULL,
  relationship text,
  phone text,
  address text,
  consent_signature text,
  consent_date text,
  consent_acknowledged boolean DEFAULT false,
  doc_gov_id text,
  doc_gov_id_name text,
  doc_gov_id_type text,
  doc_guardianship text,
  doc_guardianship_name text,
  doc_guardianship_type text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE uploaded_docs
  ADD COLUMN IF NOT EXISTS doc_type text,
  ADD COLUMN IF NOT EXISTS uploaded_by text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'received',
  ADD COLUMN IF NOT EXISTS expiration_date date,
  ADD COLUMN IF NOT EXISTS internal_notes text;

ALTER TABLE history
  ADD COLUMN IF NOT EXISTS follow_up_needed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS follow_up_date date,
  ADD COLUMN IF NOT EXISTS method text,
  ADD COLUMN IF NOT EXISTS staff_name text;

-- RLS: guardians can read/write their invite + profile via auth email match
ALTER TABLE guardian_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS guardian_invites_select ON guardian_invites;
CREATE POLICY guardian_invites_select ON guardian_invites
  FOR SELECT USING (
    lower(guardian_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid())
  );

DROP POLICY IF EXISTS guardian_invites_staff ON guardian_invites;
CREATE POLICY guardian_invites_staff ON guardian_invites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid())
  );

DROP POLICY IF EXISTS guardian_profiles_own ON guardian_profiles;
CREATE POLICY guardian_profiles_own ON guardian_profiles
  FOR ALL USING (
    auth_uid = auth.uid()
    OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid())
  );

-- Allow authenticated applicants to update their application guardian fields
DROP POLICY IF EXISTS applications_prospect_guardian ON applications;
CREATE POLICY applications_prospect_guardian ON applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM prospect_profiles pp
      WHERE pp.auth_uid = auth.uid()
        AND (
          pp.application_id = applications.id
          OR lower(pp.email) = lower(applications.talent_email)
        )
    )
    OR EXISTS (
      SELECT 1 FROM guardian_invites gi
      WHERE gi.application_id = applications.id
        AND lower(gi.guardian_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid())
  );
