-- Scope applications to a tenant company code (e.g. NZG for Nzinga).
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS company_code TEXT NOT NULL DEFAULT 'NZG';

CREATE INDEX IF NOT EXISTS applications_company_code_idx ON applications (company_code);
