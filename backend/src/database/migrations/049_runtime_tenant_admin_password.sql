-- The Vercel API connects with the limited ramu_runtime role. Keep password
-- recovery behind the narrow SECURITY DEFINER function rather than granting
-- that role direct access to users, sessions, or platform audit logs.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ramu_runtime') THEN
    GRANT EXECUTE ON FUNCTION public.platform_set_tenant_admin_password(uuid, uuid, uuid, text)
    TO ramu_runtime;
  END IF;
END;
$$;
