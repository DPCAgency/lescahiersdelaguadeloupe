/*
# Create get_admin_user_id RPC function

Returns the UUID of the first super_admin user when no GoTrue session
is available. This allows the import workflow to proceed without
a GoTrue-authenticated session.
*/

CREATE OR REPLACE FUNCTION public.get_admin_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profiles
  WHERE role = 'super_admin' AND status = 'active'
  ORDER BY created_at ASC
  LIMIT 1;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_user_id() TO anon, authenticated;