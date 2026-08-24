-- Per-user UI settings (theme, sidebar) plus self-service profile updates.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{"theme":"light","sidebar_visible":true}'::jsonb;

CREATE OR REPLACE FUNCTION public.users_protect_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- A staff member editing their own row cannot change privilege fields.
  IF NEW.auth_uid IS NOT DISTINCT FROM auth.uid() THEN
    NEW.role := OLD.role;
    NEW.active := OLD.active;
    NEW.company_code := OLD.company_code;
    NEW.email := OLD.email;
    NEW.auth_uid := OLD.auth_uid;
    NEW.id := OLD.id;
    NEW.color := OLD.color;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_protect_self_update ON users;
CREATE TRIGGER trg_users_protect_self_update
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.users_protect_self_update();

DROP POLICY IF EXISTS users_own_update ON users;
CREATE POLICY users_own_update ON users
  FOR UPDATE TO authenticated
  USING (auth_uid = auth.uid())
  WITH CHECK (auth_uid = auth.uid());
