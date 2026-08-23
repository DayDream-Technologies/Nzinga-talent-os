-- Fix: applications_prospect_own and can_write_application_doc referenced
-- auth.users directly, but the authenticated role has no SELECT grant on that
-- table, causing every PostgREST query against applications to fail with 403.
--
-- Replace auth.users lookups with auth.jwt() ->> 'email', which does not
-- require a direct table grant.

-- ── 1. Fix can_write_application_doc ─────────────────────────────────────────
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
          OR lower(a.talent_email) = lower(COALESCE((auth.jwt()) ->> 'email', ''))
        )
    );
$$;

-- ── 2. Fix applications_prospect_own ─────────────────────────────────────────
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

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
