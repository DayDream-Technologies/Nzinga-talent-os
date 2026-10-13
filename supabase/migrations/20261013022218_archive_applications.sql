-- Admins can archive applications. Prospects and other staff cannot change an archived row.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'application_status'
      AND e.enumlabel = 'archived'
  ) THEN
    ALTER TYPE application_status ADD VALUE 'archived';
  END IF;
END $$;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS archived_from TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_archived_from_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_archived_from_check
  CHECK (
    archived_from IS NULL
    OR archived_from IN ('sent', 'in_progress', 'submitted', 'pending_guardian')
  );

CREATE OR REPLACE FUNCTION public.guard_application_archive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  touching_archive boolean;
  is_admin boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    touching_archive := NEW.status::text = 'archived';
  ELSE
    touching_archive := OLD.status::text = 'archived' OR NEW.status::text = 'archived';
  END IF;

  IF NOT touching_archive THEN
    RETURN NEW;
  END IF;

  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.current_staff_role() r
    WHERE 'admin_access' = ANY (r.permissions)
       OR r.slug = 'director'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only an admin can archive, restore, or edit an archived application'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_application_archive() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_application_archive() FROM anon, authenticated;

DROP TRIGGER IF EXISTS applications_archive_guard ON public.applications;
CREATE TRIGGER applications_archive_guard
  BEFORE INSERT OR UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_application_archive();
;
