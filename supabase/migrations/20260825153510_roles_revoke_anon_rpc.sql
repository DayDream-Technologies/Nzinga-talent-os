REVOKE ALL ON FUNCTION public.current_staff_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_staff_id() FROM anon;
REVOKE ALL ON FUNCTION public.current_staff_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_staff_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_staff_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_staff_role() TO authenticated, service_role;;
