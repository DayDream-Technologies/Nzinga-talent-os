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
GRANT ALL ON public.roles TO service_role;;
