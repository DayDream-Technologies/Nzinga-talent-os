-- Authenticated staff can record their own audit events (login, invite, etc.).
-- Directors may attribute a row to another user (admin actions performed on someone).
DROP POLICY IF EXISTS audit_log_authenticated_insert ON audit_log;
CREATE POLICY audit_log_authenticated_insert ON audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IS NULL
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id AND u.auth_uid = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_uid = auth.uid() AND u.role = 'director'
    )
  );

GRANT INSERT ON TABLE audit_log TO authenticated;

-- Representative events so the global audit log is not empty on first visit.
-- Action names must match src/components/admin/AuditLogPanel.tsx EVENT_TYPES
-- and the admin-users / admin-settings edge functions.
INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, created_at)
SELECT
  actor.id,
  v.action,
  v.entity_type,
  COALESCE(v.entity_id, actor.id),
  v.details || jsonb_build_object('seed', true),
  now() - (v.hours_ago * interval '1 hour')
FROM (
  VALUES
    (
      'user_invited'::text,
      'user'::text,
      'u1'::text,
      '{"target_name":"Jordan Hayes","email":"jordan@nzinga.co","role":"scout"}'::jsonb,
      96
    ),
    (
      'role_change',
      'user',
      'u2',
      '{"target_name":"Marcus Bell","previous_role":"scout","new_role":"team1_lead"}'::jsonb,
      72
    ),
    (
      'settings_change',
      'system_settings',
      'app_name',
      '{"key":"app_name","value":"Nzinga Talent OS"}'::jsonb,
      48
    ),
    (
      'company_code_added',
      'company_code',
      'NZG',
      '{"code":"NZG"}'::jsonb,
      36
    ),
    (
      'company_code_toggled',
      'company_code',
      'TCG',
      '{"code":"TCG","active":true}'::jsonb,
      24
    ),
    (
      'user_deactivated',
      'user',
      'u6',
      '{"target_name":"Alexis Grant","email":"alexis@nzinga.co"}'::jsonb,
      12
    ),
    (
      'user_reactivated',
      'user',
      'u6',
      '{"target_name":"Alexis Grant","email":"alexis@nzinga.co"}'::jsonb,
      6
    ),
    (
      'login',
      'session',
      NULL,
      '{"method":"password"}'::jsonb,
      1
    )
) AS v(action, entity_type, entity_id, details, hours_ago)
CROSS JOIN LATERAL (
  SELECT id FROM users WHERE role = 'director' ORDER BY id DESC LIMIT 1
) AS actor
WHERE NOT EXISTS (
  SELECT 1 FROM audit_log a WHERE a.details->>'seed' = 'true'
);
