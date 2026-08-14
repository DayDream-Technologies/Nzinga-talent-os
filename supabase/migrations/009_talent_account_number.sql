-- Unique sequential account IDs for talent / applicants (e.g. NZG-100001).

CREATE SEQUENCE IF NOT EXISTS talent_account_seq START WITH 100001;

ALTER TABLE talents
  ADD COLUMN IF NOT EXISTS account_number TEXT;

UPDATE talents
SET account_number = 'NZG-' || LPAD(nextval('talent_account_seq')::text, 6, '0')
WHERE account_number IS NULL OR btrim(account_number) = '';

SELECT setval(
  'talent_account_seq',
  GREATEST(
    100000,
    COALESCE(
      (
        SELECT MAX(substring(account_number from '(\d+)$')::bigint)
        FROM talents
        WHERE account_number ~ '^NZG-[0-9]+$'
      ),
      100000
    )
  )
);

ALTER TABLE talents
  ALTER COLUMN account_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_talents_account_number
  ON talents (account_number);

CREATE OR REPLACE FUNCTION public.generate_talent_account_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'NZG-' || LPAD(nextval('talent_account_seq')::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_talent_account_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.account_number IS NULL OR btrim(NEW.account_number) = '' THEN
    NEW.account_number := public.generate_talent_account_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_talents_account_number ON talents;

CREATE TRIGGER trg_talents_account_number
  BEFORE INSERT ON talents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_talent_account_number();
