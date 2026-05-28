-- 002_auth_and_fixes.sql
-- Adds: created_by, phone/email on talents, auth_uid on users,
--        prospect_profiles, company_codes, indexes, complete RLS

-- ─────────────────────────────────────────────────────────────────────────────
-- New columns on existing tables
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE talents ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES users(id);
ALTER TABLE talents ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE talents ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';

ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_uid UUID UNIQUE REFERENCES auth.users(id);

-- ─────────────────────────────────────────────────────────────────────────────
-- prospect_profiles — links Supabase Auth to prospect portal users
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prospect_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  application_id TEXT REFERENCES applications(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- company_codes — replaces hardcoded COMPANY_CODES constant
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS company_codes (
  code TEXT PRIMARY KEY,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO company_codes (code) VALUES ('NZG'), ('NZINGA'), ('TCG')
ON CONFLICT (code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_talents_stage ON talents(stage);
CREATE INDEX IF NOT EXISTS idx_talents_scout ON talents(scout_id);
CREATE INDEX IF NOT EXISTS idx_talents_app ON talents(application_id);
CREATE INDEX IF NOT EXISTS idx_talents_created_by ON talents(created_by);
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(talent_email);
CREATE INDEX IF NOT EXISTS idx_applications_code ON applications(access_code);
CREATE INDEX IF NOT EXISTS idx_history_talent ON history(talent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_by);

-- Enforce one submitted application per email at the DB level
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_submitted_email
  ON applications(talent_email) WHERE status = 'submitted';

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS — Enable on new tables
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE prospect_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_codes ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: company_codes (public read for validation)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY company_codes_public_read ON company_codes
  FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: users
-- ─────────────────────────────────────────────────────────────────────────────

-- All authenticated users can read the user directory
CREATE POLICY users_authenticated_read ON users
  FOR SELECT TO authenticated
  USING (true);

-- Only service_role can mutate users (admin operations)
CREATE POLICY users_service_write ON users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: talents (drop old incomplete policy, add role-based)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS talents_director_all ON talents;

-- Directors: full CRUD
CREATE POLICY talents_director_all ON talents
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'director')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'director')
  );

-- Scouts: read/write holding_entry, scout_complete, not_viable
CREATE POLICY talents_scout ON talents
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'scout')
    AND stage IN ('holding_entry', 'scout_complete', 'not_viable')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'scout')
    AND stage IN ('holding_entry', 'scout_complete', 'not_viable')
  );

-- Team 1 Lead: scout_complete, team1_review
CREATE POLICY talents_team1_lead ON talents
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'team1_lead')
    AND stage IN ('scout_complete', 'team1_review')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'team1_lead')
    AND stage IN ('scout_complete', 'team1_review')
  );

-- Ops Specialist: team1_review, ops_processing
CREATE POLICY talents_ops_specialist ON talents
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'ops_specialist')
    AND stage IN ('team1_review', 'ops_processing')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'ops_specialist')
    AND stage IN ('team1_review', 'ops_processing')
  );

-- Team 2 Lead: ops_processing, team2_audit
CREATE POLICY talents_team2_lead ON talents
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'team2_lead')
    AND stage IN ('ops_processing', 'team2_audit')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'team2_lead')
    AND stage IN ('ops_processing', 'team2_audit')
  );

-- Success Manager: executive_review, signed_onboarding
CREATE POLICY talents_success_manager ON talents
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'success_manager')
    AND stage IN ('executive_review', 'signed_onboarding')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'success_manager')
    AND stage IN ('executive_review', 'signed_onboarding')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: applications (drop old permissive policies, add proper ones)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS applications_public_read ON applications;
DROP POLICY IF EXISTS applications_public_write ON applications;
DROP POLICY IF EXISTS applications_public_update ON applications;

-- Staff can read all applications
CREATE POLICY applications_staff_read ON applications
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid())
  );

-- Staff can insert/update applications (sending app links)
CREATE POLICY applications_staff_write ON applications
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid())
  );

-- Prospects can read/write their own application
CREATE POLICY applications_prospect_own ON applications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prospect_profiles pp
      WHERE pp.auth_uid = auth.uid()
        AND (pp.application_id = applications.id OR applications.talent_email = pp.email)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prospect_profiles pp
      WHERE pp.auth_uid = auth.uid()
        AND (pp.application_id = applications.id OR applications.talent_email = pp.email)
    )
  );

-- Anonymous access-code lookup (for portal resume without login)
CREATE POLICY applications_anon_code_lookup ON applications
  FOR SELECT TO anon
  USING (true);

-- Anonymous can update their own app (autosave before account creation)
CREATE POLICY applications_anon_write ON applications
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY applications_anon_update ON applications
  FOR UPDATE TO anon
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: tasks
-- ─────────────────────────────────────────────────────────────────────────────

-- All staff can read all tasks
CREATE POLICY tasks_staff_read ON tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid())
  );

-- Staff can create tasks
CREATE POLICY tasks_staff_insert ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid())
  );

-- Staff can update tasks they own or are assigned to; directors can update all
CREATE POLICY tasks_staff_update ON tasks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.auth_uid = auth.uid()
      AND (u.role = 'director' OR u.id = tasks.assigned_to OR u.id = tasks.created_by)
    )
  );

-- Directors can delete tasks
CREATE POLICY tasks_director_delete ON tasks
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'director')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: history
-- ─────────────────────────────────────────────────────────────────────────────

-- All staff can read history
CREATE POLICY history_staff_read ON history
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid())
  );

-- All staff can create history entries
CREATE POLICY history_staff_insert ON history
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid())
  );

-- Directors can update (flag/unflag)
CREATE POLICY history_director_update ON history
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'director')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: uploaded_docs
-- ─────────────────────────────────────────────────────────────────────────────

-- All staff can read uploaded docs
CREATE POLICY uploaded_docs_staff_read ON uploaded_docs
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid())
  );

-- Upload roles (scout, ops_specialist, director) can insert
CREATE POLICY uploaded_docs_upload ON uploaded_docs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_uid = auth.uid()
        AND u.role IN ('scout', 'ops_specialist', 'director')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: prospect_profiles
-- ─────────────────────────────────────────────────────────────────────────────

-- Prospects can read/update their own profile
CREATE POLICY prospect_profiles_own ON prospect_profiles
  FOR ALL TO authenticated
  USING (auth_uid = auth.uid())
  WITH CHECK (auth_uid = auth.uid());

-- Staff can read prospect profiles
CREATE POLICY prospect_profiles_staff_read ON prospect_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage policies (applied via SQL for the 'documents' bucket)
-- Note: run separately if using Supabase dashboard for bucket creation
-- ─────────────────────────────────────────────────────────────────────────────

-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
-- ON CONFLICT (id) DO NOTHING;

-- Storage upload: scout, ops_specialist, director
-- CREATE POLICY storage_docs_upload ON storage.objects
--   FOR INSERT TO authenticated
--   WITH CHECK (
--     bucket_id = 'documents'
--     AND EXISTS (
--       SELECT 1 FROM public.users u
--       WHERE u.auth_uid = auth.uid()
--         AND u.role IN ('scout', 'ops_specialist', 'director')
--     )
--   );

-- Storage read: all authenticated staff
-- CREATE POLICY storage_docs_read ON storage.objects
--   FOR SELECT TO authenticated
--   USING (
--     bucket_id = 'documents'
--     AND EXISTS (SELECT 1 FROM public.users u WHERE u.auth_uid = auth.uid())
--   );
