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

DROP POLICY IF EXISTS applications_prospect_own ON public.applications;
CREATE POLICY applications_prospect_own ON public.applications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prospect_profiles pp
      WHERE pp.auth_uid = (SELECT auth.uid())
        AND (
          pp.application_id = applications.id
          OR lower(applications.talent_email) = lower(pp.email)
        )
    )
    OR EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = (SELECT auth.uid())
        AND lower(au.email) = lower(applications.talent_email)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prospect_profiles pp
      WHERE pp.auth_uid = (SELECT auth.uid())
        AND (
          pp.application_id = applications.id
          OR lower(applications.talent_email) = lower(pp.email)
        )
    )
    OR EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = (SELECT auth.uid())
        AND lower(au.email) = lower(applications.talent_email)
    )
  );
