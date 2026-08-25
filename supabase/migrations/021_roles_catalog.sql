-- Data-driven staff roles: catalog table, users.role as text FK, talent RLS by role definition.

CREATE TABLE IF NOT EXISTS public.roles (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_system BOOLEAN NOT NULL DEFAULT false,
  stage_access TEXT[] NOT NULL DEFAULT '{}',
  module_paths TEXT[] NOT NULL DEFAULT '{}',
  permissions TEXT[] NOT NULL DEFAULT '{}',
  action_stage TEXT NOT NULL DEFAULT 'holding_entry',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_staff_read ON public.roles;
CREATE POLICY roles_staff_read ON public.roles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_uid = auth.uid()
        AND COALESCE(u.active, true)
    )
  );

GRANT SELECT ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;

INSERT INTO public.roles (slug, name, description, is_system, stage_access, module_paths, permissions, action_stage)
VALUES
  (
    'scout',
    'Scouting Agent',
    'Identify, evaluate, and qualify prospects. Assemble a complete Client Packet for Success Manager review.',
    true,
    ARRAY['holding_entry', 'scout_complete', 'not_viable'],
    ARRAY['prospects','applications','renewal-offers','clients','active-roster','pipeline','prospect-tracking','send-email','messaging','support-tickets','agency-tasks','appointments','new-ticket','calendar','settings','report-roster-scorecard','report-applicant-pool','report-onboarding','report-roster-openings','reports'],
    ARRAY['submit_client_packet','send_application','track_own_submissions'],
    'holding_entry'
  ),
  (
    'team1_lead',
    'Team 1 Lead',
    'Legacy Client Packet Review path into operations.',
    true,
    ARRAY['scout_complete', 'team1_review'],
    ARRAY['prospects','applications','renewal-offers','clients','active-roster','pipeline','prospect-tracking','send-email','messaging','support-tickets','agency-tasks','appointments','new-ticket','calendar','settings','report-roster-scorecard','report-applicant-pool','report-onboarding','report-roster-openings','reports'],
    ARRAY['return_packet'],
    'team1_review'
  ),
  (
    'ops_specialist',
    'Ops Specialist',
    'Compliance, documents, and contract framework.',
    true,
    ARRAY['team1_review', 'ops_processing'],
    ARRAY['escrow-deposit','client-invoices','post-retainers','overdue-interest','batch-receipts','retainer-plans','log-expense','vendors','disbursements','issue-payouts','settings','report-escrow-balances','report-gross-bookings','report-ar-aging','report-overdue-accounts','report-pending-payouts','reports'],
    ARRAY[]::text[],
    'ops_processing'
  ),
  (
    'team2_lead',
    'Team 2 Lead',
    'Contract pending audit before director review.',
    true,
    ARRAY['ops_processing', 'team2_audit'],
    ARRAY['prospects','applications','renewal-offers','clients','active-roster','pipeline','prospect-tracking','send-email','messaging','support-tickets','agency-tasks','appointments','new-ticket','calendar','settings','report-roster-scorecard','report-applicant-pool','report-onboarding','report-roster-openings','reports'],
    ARRAY[]::text[],
    'team2_audit'
  ),
  (
    'director',
    'Director',
    'Full pipeline access, admin, and executive decisions.',
    true,
    ARRAY['holding_entry','scout_complete','team1_review','ops_processing','team2_audit','executive_review','signed_onboarding','archived','not_viable'],
    ARRAY['prospects','applications','renewal-offers','clients','active-roster','pipeline','prospect-tracking','send-email','messaging','support-tickets','agency-tasks','appointments','new-ticket','calendar','settings','report-roster-scorecard','report-applicant-pool','report-onboarding','report-roster-openings','reports','escrow-deposit','client-invoices','post-retainers','overdue-interest','batch-receipts','retainer-plans','log-expense','vendors','disbursements','issue-payouts','report-escrow-balances','report-gross-bookings','report-ar-aging','report-overdue-accounts','report-pending-payouts'],
    ARRAY['submit_client_packet','send_application','track_own_submissions','approve_client_packet','return_packet','publish_contract','admin_access'],
    'executive_review'
  ),
  (
    'success_manager',
    'Success Manager',
    'Quality-assure Client Packets, approve as Approved - Future, publish contracts, and onboard signed clients.',
    true,
    ARRAY['team1_review','team2_audit','executive_review','signed_onboarding'],
    ARRAY['prospects','applications','renewal-offers','clients','active-roster','pipeline','prospect-tracking','send-email','messaging','support-tickets','agency-tasks','appointments','new-ticket','calendar','settings','report-roster-scorecard','report-applicant-pool','report-onboarding','report-roster-openings','reports','escrow-deposit','client-invoices','post-retainers','overdue-interest','batch-receipts','retainer-plans','log-expense','vendors','disbursements','issue-payouts','report-escrow-balances','report-gross-bookings','report-ar-aging','report-overdue-accounts','report-pending-payouts'],
    ARRAY['approve_client_packet','return_packet','publish_contract'],
    'team1_review'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system = EXCLUDED.is_system,
  stage_access = EXCLUDED.stage_access,
  module_paths = EXCLUDED.module_paths,
  permissions = EXCLUDED.permissions,
  action_stage = EXCLUDED.action_stage;

-- Convert users.role off ENUM. Drop policies that cast role to user_role first.
DROP POLICY IF EXISTS audit_log_authenticated_insert ON public.audit_log;
DROP POLICY IF EXISTS audit_log_director_read ON public.audit_log;
DROP POLICY IF EXISTS history_director_update ON public.history;
DROP POLICY IF EXISTS system_settings_director_all ON public.system_settings;
DROP POLICY IF EXISTS talents_director_all ON public.talents;
DROP POLICY IF EXISTS talents_scout ON public.talents;
DROP POLICY IF EXISTS talents_team1_lead ON public.talents;
DROP POLICY IF EXISTS talents_ops_specialist ON public.talents;
DROP POLICY IF EXISTS talents_team2_lead ON public.talents;
DROP POLICY IF EXISTS talents_success_manager ON public.talents;
DROP POLICY IF EXISTS tasks_director_delete ON public.tasks;
DROP POLICY IF EXISTS tasks_staff_update ON public.tasks;
DROP POLICY IF EXISTS uploaded_docs_upload ON public.uploaded_docs;

CREATE OR REPLACE FUNCTION public.staff_is_company_director(target_company text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_uid = auth.uid()
      AND u.role::text = 'director'
      AND u.company_code = target_company
      AND COALESCE(u.active, true)
  );
$$;

ALTER TABLE public.users
  ALTER COLUMN role DROP DEFAULT;

ALTER TABLE public.users
  ALTER COLUMN role TYPE TEXT USING role::text;

ALTER TABLE public.users
  ALTER COLUMN role SET DEFAULT 'scout';

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_fk;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_fk FOREIGN KEY (role) REFERENCES public.roles(slug);

DROP TYPE IF EXISTS public.user_role;

CREATE POLICY audit_log_director_read ON public.audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.auth_uid = auth.uid() AND u.role = 'director')
  );

CREATE POLICY audit_log_authenticated_insert ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id IS NULL
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = audit_log.user_id AND u.auth_uid = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.auth_uid = auth.uid() AND u.role = 'director')
  );

CREATE POLICY history_director_update ON public.history
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.auth_uid = auth.uid() AND u.role = 'director')
  );

CREATE POLICY system_settings_director_all ON public.system_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.auth_uid = auth.uid() AND u.role = 'director')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.auth_uid = auth.uid() AND u.role = 'director')
  );

CREATE POLICY tasks_director_delete ON public.tasks
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.auth_uid = auth.uid() AND u.role = 'director')
  );

CREATE POLICY tasks_staff_update ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_uid = auth.uid()
        AND (u.role = 'director' OR u.id = tasks.assigned_to OR u.id = tasks.created_by)
    )
  );

CREATE POLICY uploaded_docs_upload ON public.uploaded_docs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_uid = auth.uid()
        AND u.role = ANY (ARRAY['scout', 'ops_specialist', 'director'])
    )
  );

CREATE OR REPLACE FUNCTION public.current_staff_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM public.users u
  WHERE u.auth_uid = auth.uid()
    AND COALESCE(u.active, true)
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_staff_role()
RETURNS public.roles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.*
  FROM public.users u
  JOIN public.roles r ON r.slug = u.role
  WHERE u.auth_uid = auth.uid()
    AND COALESCE(u.active, true)
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.current_staff_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_staff_id() FROM anon;
REVOKE ALL ON FUNCTION public.current_staff_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_staff_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_staff_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_staff_role() TO authenticated, service_role;

DROP POLICY IF EXISTS talents_director_all ON public.talents;
DROP POLICY IF EXISTS talents_scout ON public.talents;
DROP POLICY IF EXISTS talents_team1_lead ON public.talents;
DROP POLICY IF EXISTS talents_ops_specialist ON public.talents;
DROP POLICY IF EXISTS talents_team2_lead ON public.talents;
DROP POLICY IF EXISTS talents_success_manager ON public.talents;

DROP POLICY IF EXISTS talents_staff_select ON public.talents;
CREATE POLICY talents_staff_select ON public.talents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.current_staff_role() r
      WHERE
        'admin_access' = ANY (r.permissions)
        OR r.slug = 'director'
        OR talents.stage::text = ANY (r.stage_access)
        OR (
          'track_own_submissions' = ANY (r.permissions)
          AND talents.scout_id IS NOT NULL
          AND talents.scout_id = public.current_staff_id()
        )
    )
  );

DROP POLICY IF EXISTS talents_staff_write ON public.talents;
DROP POLICY IF EXISTS talents_staff_insert ON public.talents;
DROP POLICY IF EXISTS talents_staff_update ON public.talents;
DROP POLICY IF EXISTS talents_staff_delete ON public.talents;

CREATE POLICY talents_staff_insert ON public.talents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.current_staff_role() r
      WHERE
        'admin_access' = ANY (r.permissions)
        OR r.slug = 'director'
        OR talents.stage::text = ANY (r.stage_access)
    )
  );

-- USING is the existing row; WITH CHECK allows advancing to a later stage the role cannot keep editing.
CREATE POLICY talents_staff_update ON public.talents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.current_staff_role() r
      WHERE
        'admin_access' = ANY (r.permissions)
        OR r.slug = 'director'
        OR talents.stage::text = ANY (r.stage_access)
    )
  )
  WITH CHECK (true);

CREATE POLICY talents_staff_delete ON public.talents
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.current_staff_role() r
      WHERE
        'admin_access' = ANY (r.permissions)
        OR r.slug = 'director'
        OR talents.stage::text = ANY (r.stage_access)
    )
  );

DROP POLICY IF EXISTS talents_prospect_sign ON public.talents;
CREATE POLICY talents_prospect_sign ON public.talents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.prospect_profiles pp
      WHERE pp.auth_uid = auth.uid()
        AND (
          (
            talents.email IS NOT NULL
            AND talents.email <> ''
            AND lower(talents.email) = lower(pp.email)
          )
          OR (
            pp.application_id IS NOT NULL
            AND talents.application_id IS NOT NULL
            AND pp.application_id = talents.application_id
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.prospect_profiles pp
      WHERE pp.auth_uid = auth.uid()
        AND (
          (
            talents.email IS NOT NULL
            AND talents.email <> ''
            AND lower(talents.email) = lower(pp.email)
          )
          OR (
            pp.application_id IS NOT NULL
            AND talents.application_id IS NOT NULL
            AND pp.application_id = talents.application_id
          )
        )
    )
  );
