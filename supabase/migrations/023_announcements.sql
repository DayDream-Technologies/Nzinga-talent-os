-- Staff announcements shown on the workspace footer.

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS announcements_staff_read ON announcements;
CREATE POLICY announcements_staff_read ON announcements
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid()));

DROP POLICY IF EXISTS announcements_director_insert ON announcements;
CREATE POLICY announcements_director_insert ON announcements
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'director'));

DROP POLICY IF EXISTS announcements_director_update ON announcements;
CREATE POLICY announcements_director_update ON announcements
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'director'))
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'director'));

DROP POLICY IF EXISTS announcements_director_delete ON announcements;
CREATE POLICY announcements_director_delete ON announcements
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.role = 'director'));
