-- Avoid infinite RLS recursion when staff update their own users row.
-- policies on users must not subquery users during UPDATE/INSERT.

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
      AND u.role = 'director'
      AND u.company_code = target_company
      AND COALESCE(u.active, true)
  );
$$;

REVOKE ALL ON FUNCTION public.staff_is_company_director(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_is_company_director(text) TO authenticated, service_role;

DROP POLICY IF EXISTS users_director_update ON users;
CREATE POLICY users_director_update ON users
  FOR UPDATE TO authenticated
  USING (public.staff_is_company_director(company_code))
  WITH CHECK (public.staff_is_company_director(company_code));

DROP POLICY IF EXISTS users_director_insert ON users;
CREATE POLICY users_director_insert ON users
  FOR INSERT TO authenticated
  WITH CHECK (public.staff_is_company_director(company_code));
