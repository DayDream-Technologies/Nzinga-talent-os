REVOKE ALL ON FUNCTION public.staff_can_view_training(text, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_can_view_training(text, text[]) FROM anon;
REVOKE ALL ON FUNCTION public.staff_can_manage_training_storage(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_can_read_training_storage(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_can_manage_training_storage(text) FROM anon;
REVOKE ALL ON FUNCTION public.staff_can_read_training_storage(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.staff_can_view_training(text, text[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.staff_can_manage_training_storage(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.staff_can_read_training_storage(text) TO authenticated, service_role;;
