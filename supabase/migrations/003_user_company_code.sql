-- 003_user_company_code.sql
-- Adds company_code column to users, enforces it during login,
-- and allows directors to invite new team members

ALTER TABLE users ADD COLUMN IF NOT EXISTS company_code TEXT REFERENCES company_codes(code) DEFAULT 'NZG';

-- Set all existing users to NZG
UPDATE users SET company_code = 'NZG' WHERE company_code IS NULL;

-- Make it NOT NULL going forward
ALTER TABLE users ALTER COLUMN company_code SET NOT NULL;

-- Index for quick lookup during login
CREATE INDEX IF NOT EXISTS idx_users_company_code ON users(company_code);

-- Allow directors to insert new users in their company
DROP POLICY IF EXISTS users_director_insert ON users;
CREATE POLICY users_director_insert ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_uid = auth.uid()
        AND u.role = 'director'
        AND u.company_code = company_code
    )
  );

-- NOTE: users_authenticated_read from 002 already grants SELECT to all
-- authenticated users. A company-scoped policy here would cause infinite
-- recursion (subquery on same RLS-protected table). If company isolation
-- is needed later, use a SECURITY DEFINER helper function instead.
