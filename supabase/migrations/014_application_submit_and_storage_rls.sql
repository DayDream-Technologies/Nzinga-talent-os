-- Staff and application owners can write application-docs.
-- SECURITY DEFINER so storage policies are not blocked by applications RLS.
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
      WHERE u.auth_uid = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.id = (storage.foldername(object_name))[1]
        AND (
          lower(a.talent_email) = lower(COALESCE((SELECT auth.jwt()) ->> 'email', ''))
          OR EXISTS (
            SELECT 1 FROM public.prospect_profiles pp
            WHERE pp.auth_uid = (SELECT auth.uid())
              AND (
                pp.application_id = a.id
                OR lower(pp.email) = lower(a.talent_email)
              )
          )
        )
    );
$$;

REVOKE ALL ON FUNCTION public.can_write_application_doc(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_write_application_doc(text) TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can upload application docs" ON storage.objects;
CREATE POLICY "Authenticated users can upload application docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'application-docs'
    AND public.can_write_application_doc(name)
  );

DROP POLICY IF EXISTS "Users can update their own application docs" ON storage.objects;
CREATE POLICY "Users can update their own application docs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'application-docs'
    AND public.can_write_application_doc(name)
  )
  WITH CHECK (
    bucket_id = 'application-docs'
    AND public.can_write_application_doc(name)
  );

DROP POLICY IF EXISTS "Users can view their own application docs" ON storage.objects;
CREATE POLICY "Users can view their own application docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'application-docs'
    AND public.can_write_application_doc(name)
  );

-- Prospects can save/submit when JWT email matches, even if application_id is stale.
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
    OR lower(applications.talent_email) = lower(COALESCE((SELECT auth.jwt()) ->> 'email', ''))
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
    OR lower(applications.talent_email) = lower(COALESCE((SELECT auth.jwt()) ->> 'email', ''))
  );
