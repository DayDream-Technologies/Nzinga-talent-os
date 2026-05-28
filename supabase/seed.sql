-- Seed users (passwords managed via Supabase Auth in production)
INSERT INTO users (id, name, initials, role, email, title, color) VALUES
  ('u1', 'Jordan Hayes', 'JH', 'scout', 'jordan@nzinga.co', 'Talent Scout', '#7c3aed'),
  ('u2', 'Marcus Bell', 'MB', 'team1_lead', 'marcus@nzinga.co', 'Team 1 Lead', '#f59e0b'),
  ('u3', 'Priya Okafor', 'PO', 'ops_specialist', 'priya@nzinga.co', 'Ops Specialist', '#3b82f6'),
  ('u4', 'Devon Cruz', 'DC', 'team2_lead', 'devon@nzinga.co', 'Team 2 Lead', '#06b6d4'),
  ('u5', 'Simone Nzinga', 'SN', 'director', 'simone@nzinga.co', 'Executive Director', '#10b981'),
  ('u6', 'Alexis Grant', 'AG', 'success_manager', 'alexis@nzinga.co', 'Success Manager', '#ec4899')
ON CONFLICT (id) DO NOTHING;
