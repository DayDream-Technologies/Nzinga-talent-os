-- 006_audit_and_settings.sql
-- Global audit log, system settings, user active flag

ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT REFERENCES users(id)
);

INSERT INTO system_settings (key, value) VALUES
  ('app_name', '"Nzinga Talent OS"'),
  ('demo_mode', 'false'),
  ('email_sender_name', '"Nzinga Talent Group"')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Directors can read all audit entries
CREATE POLICY audit_log_director_read ON audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'director')
  );

-- Service role and edge functions insert audit entries
CREATE POLICY audit_log_service_write ON audit_log
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Directors manage system settings
CREATE POLICY system_settings_director_all ON system_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'director')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'director')
  );

-- Directors can update users in their company (role, active status)
CREATE POLICY users_director_update ON users
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_uid = auth.uid()
        AND u.role = 'director'
        AND u.company_code = users.company_code
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_uid = auth.uid()
        AND u.role = 'director'
        AND u.company_code = users.company_code
    )
  );
