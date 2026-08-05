-- Create prospect_profiles via trigger so signup works when email confirmation
-- is enabled (client has no authenticated session yet → RLS would block INSERT).

CREATE OR REPLACE FUNCTION public.handle_new_prospect_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'account_type', '') = 'prospect' THEN
    INSERT INTO public.prospect_profiles (auth_uid, email, name)
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
        split_part(COALESCE(NEW.email, 'prospect'), '@', 1)
      )
    )
    ON CONFLICT (auth_uid) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_prospect ON auth.users;

CREATE TRIGGER on_auth_user_created_prospect
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_prospect_user();

-- Allow authenticated prospects to insert their own row (fallback if trigger missed).
DROP POLICY IF EXISTS prospect_profiles_insert_own ON prospect_profiles;
CREATE POLICY prospect_profiles_insert_own ON prospect_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth_uid = auth.uid());
