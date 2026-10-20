-- Keep the runtime role unable to write the platform audit table directly.
-- This narrow function records only a Super Admin's own password change.
CREATE OR REPLACE FUNCTION public.platform_record_self_password_change(p_actor_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM public.platform_assert_admin(p_actor_user_id);
  INSERT INTO public.platform_audit_logs(actor_user_id, action, entity_type, entity_id)
  VALUES (p_actor_user_id, 'platform.password_changed', 'user', p_actor_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.platform_record_self_password_change(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.platform_record_self_password_change(uuid) TO ramu_app;
GRANT EXECUTE ON FUNCTION public.platform_record_self_password_change(uuid) TO ramu_runtime_permissions;
