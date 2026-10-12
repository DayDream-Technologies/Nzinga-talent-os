-- Production seed: tenant company codes only.
-- Staff accounts are created with Invite User (admin-users), not inserted here.

INSERT INTO company_codes (code, active) VALUES
  ('NZG', TRUE),
  ('NZINGA', TRUE),
  ('TCG', TRUE)
ON CONFLICT (code) DO NOTHING;
