-- Allow approved talent (prospect auth) to read their own pipeline talent row
CREATE INDEX IF NOT EXISTS idx_talents_email_lower ON talents (lower(email));

DROP POLICY IF EXISTS talents_prospect_own ON talents;
CREATE POLICY talents_prospect_own ON talents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM prospect_profiles pp
      WHERE pp.auth_uid = auth.uid()
        AND (
          (
            talents.email IS NOT NULL
            AND talents.email <> ''
            AND lower(talents.email) = lower(pp.email)
          )
          OR (
            pp.application_id IS NOT NULL
            AND talents.application_id IS NOT NULL
            AND pp.application_id = talents.application_id
          )
        )
    )
  );
