-- Seed: users (auth_uid is NULL until real Supabase Auth users are created)
INSERT INTO users (id, name, initials, role, email, title, color, auth_uid, company_code) VALUES
  ('u1', 'Jordan Hayes', 'JH', 'scout', 'jordan@nzinga.co', 'Talent Scout', '#7c3aed', NULL, 'NZG'),
  ('u2', 'Marcus Bell', 'MB', 'team1_lead', 'marcus@nzinga.co', 'Team 1 Lead', '#f59e0b', NULL, 'NZG'),
  ('u3', 'Priya Okafor', 'PO', 'ops_specialist', 'priya@nzinga.co', 'Ops Specialist', '#3b82f6', NULL, 'NZG'),
  ('u4', 'Devon Cruz', 'DC', 'team2_lead', 'devon@nzinga.co', 'Team 2 Lead', '#06b6d4', NULL, 'NZG'),
  ('u5', 'Simone Nzinga', 'SN', 'director', 'simone@nzinga.co', 'Executive Director', '#10b981', NULL, 'NZG'),
  ('u6', 'Alexis Grant', 'AG', 'success_manager', 'alexis@nzinga.co', 'Success Manager', '#ec4899', NULL, 'NZG')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  initials = EXCLUDED.initials,
  role = EXCLUDED.role,
  email = EXCLUDED.email,
  title = EXCLUDED.title,
  color = EXCLUDED.color,
  company_code = EXCLUDED.company_code;

-- Seed: company_codes
INSERT INTO company_codes (code, active) VALUES
  ('NZG', TRUE),
  ('NZINGA', TRUE),
  ('TCG', TRUE)
ON CONFLICT (code) DO NOTHING;

-- After deploying, create auth users for each staff member in Supabase Auth,
-- then run the following to link them:
--
-- UPDATE users SET auth_uid = '<auth.users.id for jordan>' WHERE id = 'u1';
-- UPDATE users SET auth_uid = '<auth.users.id for marcus>' WHERE id = 'u2';
-- UPDATE users SET auth_uid = '<auth.users.id for priya>'  WHERE id = 'u3';
-- UPDATE users SET auth_uid = '<auth.users.id for devon>'  WHERE id = 'u4';
-- UPDATE users SET auth_uid = '<auth.users.id for simone>' WHERE id = 'u5';
-- UPDATE users SET auth_uid = '<auth.users.id for alexis>' WHERE id = 'u6';

-- Test applicants + pipeline talents (NZG):
--   node scripts/seed-test-applicants.mjs
-- Covers application statuses (sent / in_progress / submitted incomplete+complete)
-- and pipeline stages including scout_complete and team2_audit.

-- Sample global audit events (skipped if the migration already inserted them)
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
    ('user_invited'::text, 'user'::text, 'u1'::text, '{"target_name":"Jordan Hayes","email":"jordan@nzinga.co","role":"scout"}'::jsonb, 96),
    ('role_change', 'user', 'u2', '{"target_name":"Marcus Bell","previous_role":"scout","new_role":"team1_lead"}'::jsonb, 72),
    ('settings_change', 'system_settings', 'app_name', '{"key":"app_name","value":"Nzinga Talent OS"}'::jsonb, 48),
    ('company_code_added', 'company_code', 'NZG', '{"code":"NZG"}'::jsonb, 36),
    ('company_code_toggled', 'company_code', 'TCG', '{"code":"TCG","active":true}'::jsonb, 24),
    ('user_deactivated', 'user', 'u6', '{"target_name":"Alexis Grant","email":"alexis@nzinga.co"}'::jsonb, 12),
    ('user_reactivated', 'user', 'u6', '{"target_name":"Alexis Grant","email":"alexis@nzinga.co"}'::jsonb, 6),
    ('login', 'session', NULL, '{"method":"password"}'::jsonb, 1)
) AS v(action, entity_type, entity_id, details, hours_ago)
CROSS JOIN LATERAL (
  SELECT id FROM users WHERE role = 'director' ORDER BY id DESC LIMIT 1
) AS actor
WHERE NOT EXISTS (
  SELECT 1 FROM audit_log a WHERE a.details->>'seed' = 'true'
);
