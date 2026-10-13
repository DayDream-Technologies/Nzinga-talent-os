-- Parents opened /guardian/verify and requested their child's application.
-- Existing policies let a guardian UPDATE that row, but not SELECT it.
-- PostgREST then returns zero rows, and .single() surfaces that as 406.

DROP POLICY IF EXISTS applications_guardian_read ON public.applications;
CREATE POLICY applications_guardian_read ON public.applications
  FOR SELECT TO authenticated
  USING (
    lower(coalesce(guardian_email, '')) = lower(coalesce((SELECT auth.jwt()) ->> 'email', ''))
    OR EXISTS (
      SELECT 1 FROM public.guardian_invites gi
      WHERE gi.application_id = applications.id
        AND lower(gi.guardian_email) = lower(coalesce((SELECT auth.jwt()) ->> 'email', ''))
    )
  );
