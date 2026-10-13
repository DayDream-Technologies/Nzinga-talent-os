CREATE POLICY audit_log_director_read ON public.audit_log FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_uid = auth.uid() AND u.role = 'director'));
CREATE POLICY audit_log_authenticated_insert ON public.audit_log FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = audit_log.user_id AND u.auth_uid = auth.uid()) OR EXISTS (SELECT 1 FROM public.users u WHERE u.auth_uid = auth.uid() AND u.role = 'director'));
CREATE POLICY history_director_update ON public.history FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_uid = auth.uid() AND u.role = 'director'));
CREATE POLICY system_settings_director_all ON public.system_settings FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_uid = auth.uid() AND u.role = 'director')) WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_uid = auth.uid() AND u.role = 'director'));
CREATE POLICY tasks_director_delete ON public.tasks FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_uid = auth.uid() AND u.role = 'director'));
CREATE POLICY tasks_staff_update ON public.tasks FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_uid = auth.uid() AND (u.role = 'director' OR u.id = tasks.assigned_to OR u.id = tasks.created_by)));
CREATE POLICY uploaded_docs_upload ON public.uploaded_docs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_uid = auth.uid() AND u.role = ANY (ARRAY['scout','ops_specialist','director'])));

CREATE OR REPLACE FUNCTION public.current_staff_id() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT u.id FROM public.users u WHERE u.auth_uid = auth.uid() AND COALESCE(u.active, true) LIMIT 1 $$;
CREATE OR REPLACE FUNCTION public.current_staff_role() RETURNS public.roles LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT r.* FROM public.users u JOIN public.roles r ON r.slug = u.role WHERE u.auth_uid = auth.uid() AND COALESCE(u.active, true) LIMIT 1 $$;
REVOKE ALL ON FUNCTION public.current_staff_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_staff_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_staff_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_staff_role() TO authenticated, service_role;

DROP POLICY IF EXISTS talents_staff_select ON public.talents;
CREATE POLICY talents_staff_select ON public.talents FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.current_staff_role() r WHERE 'admin_access' = ANY (r.permissions) OR r.slug = 'director' OR talents.stage::text = ANY (r.stage_access) OR ('track_own_submissions' = ANY (r.permissions) AND talents.scout_id IS NOT NULL AND talents.scout_id = public.current_staff_id())));
DROP POLICY IF EXISTS talents_staff_insert ON public.talents;
CREATE POLICY talents_staff_insert ON public.talents FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.current_staff_role() r WHERE 'admin_access' = ANY (r.permissions) OR r.slug = 'director' OR talents.stage::text = ANY (r.stage_access)));
DROP POLICY IF EXISTS talents_staff_update ON public.talents;
CREATE POLICY talents_staff_update ON public.talents FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.current_staff_role() r WHERE 'admin_access' = ANY (r.permissions) OR r.slug = 'director' OR talents.stage::text = ANY (r.stage_access))) WITH CHECK (true);
DROP POLICY IF EXISTS talents_staff_delete ON public.talents;
CREATE POLICY talents_staff_delete ON public.talents FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.current_staff_role() r WHERE 'admin_access' = ANY (r.permissions) OR r.slug = 'director' OR talents.stage::text = ANY (r.stage_access)));
DROP POLICY IF EXISTS talents_prospect_sign ON public.talents;
CREATE POLICY talents_prospect_sign ON public.talents FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.prospect_profiles pp WHERE pp.auth_uid = auth.uid() AND ((talents.email IS NOT NULL AND talents.email <> '' AND lower(talents.email) = lower(pp.email)) OR (pp.application_id IS NOT NULL AND talents.application_id IS NOT NULL AND pp.application_id = talents.application_id)))) WITH CHECK (EXISTS (SELECT 1 FROM public.prospect_profiles pp WHERE pp.auth_uid = auth.uid() AND ((talents.email IS NOT NULL AND talents.email <> '' AND lower(talents.email) = lower(pp.email)) OR (pp.application_id IS NOT NULL AND talents.application_id IS NOT NULL AND pp.application_id = talents.application_id))));;
