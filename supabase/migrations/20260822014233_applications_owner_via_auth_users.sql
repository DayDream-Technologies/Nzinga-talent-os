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
  );;
