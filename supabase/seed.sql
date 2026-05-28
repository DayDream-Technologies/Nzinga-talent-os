-- Seed: users (auth_uid is NULL until real Supabase Auth users are created)
INSERT INTO users (id, name, initials, role, email, title, color, auth_uid) VALUES
  ('u1', 'Jordan Hayes', 'JH', 'scout', 'jordan@nzinga.co', 'Talent Scout', '#7c3aed', NULL),
  ('u2', 'Marcus Bell', 'MB', 'team1_lead', 'marcus@nzinga.co', 'Team 1 Lead', '#f59e0b', NULL),
  ('u3', 'Priya Okafor', 'PO', 'ops_specialist', 'priya@nzinga.co', 'Ops Specialist', '#3b82f6', NULL),
  ('u4', 'Devon Cruz', 'DC', 'team2_lead', 'devon@nzinga.co', 'Team 2 Lead', '#06b6d4', NULL),
  ('u5', 'Simone Nzinga', 'SN', 'director', 'simone@nzinga.co', 'Executive Director', '#10b981', NULL),
  ('u6', 'Alexis Grant', 'AG', 'success_manager', 'alexis@nzinga.co', 'Success Manager', '#ec4899', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  initials = EXCLUDED.initials,
  role = EXCLUDED.role,
  email = EXCLUDED.email,
  title = EXCLUDED.title,
  color = EXCLUDED.color;

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
