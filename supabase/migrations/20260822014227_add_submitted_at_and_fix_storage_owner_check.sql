ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

CREATE OR REPLACE FUNCTION public.can_write_application_doc(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_uid = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = (storage.foldername(object_name))[1]
        AND (
          EXISTS (
            SELECT 1 FROM public.prospect_profiles pp
            WHERE pp.auth_uid = auth.uid()
              AND (
                pp.application_id = a.id
                OR lower(pp.email) = lower(a.talent_email)
              )
          )
          OR EXISTS (
            SELECT 1 FROM auth.users au
            WHERE au.id = auth.uid()
              AND lower(au.email) = lower(a.talent_email)
          )
        )
    );
$$;

UPDATE public.applications
SET data = data
  - 'doc_gov_id'
  - 'doc_sport_photo'
  - 'doc_profile_photo'
WHERE id = 'app_1787362594724';

UPDATE public.prospect_profiles
SET application_id = 'app_1787362594724'
WHERE lower(email) = 'dwasilewski@daydreamtechnologies.net'
  AND application_id IS NULL;
;
