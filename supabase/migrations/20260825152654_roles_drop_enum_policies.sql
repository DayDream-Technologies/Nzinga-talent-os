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
    SELECT 1 FROM public.users u
    WHERE u.auth_uid = auth.uid()
      AND u.role::text = 'director'
      AND u.company_code = target_company
      AND COALESCE(u.active, true)
  );
$$;

ALTER TABLE public.users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.users ALTER COLUMN role TYPE TEXT USING role::text;
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'scout';
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_fk;
ALTER TABLE public.users ADD CONSTRAINT users_role_fk FOREIGN KEY (role) REFERENCES public.roles(slug);
DROP TYPE IF EXISTS public.user_role;;
