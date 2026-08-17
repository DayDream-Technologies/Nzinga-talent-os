-- Allow minor applications awaiting guardian verification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'application_status'
      AND e.enumlabel = 'pending_guardian'
  ) THEN
    ALTER TYPE application_status ADD VALUE 'pending_guardian';
  END IF;
END $$;
