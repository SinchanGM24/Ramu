-- Platform operators may observe all school account metadata, but mutable
-- account operations are reserved for the School Admin that owns a tenant.
CREATE OR REPLACE FUNCTION public.platform_assert_school_admin_target(p_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.school_memberships membership
    WHERE membership.user_id = p_target_user_id
      AND membership.role = 'SCHOOL_ADMIN'
  ) THEN
    RAISE EXCEPTION 'Hanya akun Admin Sekolah yang dapat diubah dari panel platform' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_set_account_status(p_actor_user_id uuid, p_target_user_id uuid, p_is_active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM public.platform_assert_admin(p_actor_user_id);
  IF p_target_user_id = p_actor_user_id OR EXISTS (SELECT 1 FROM public.platform_administrators WHERE user_id = p_target_user_id) THEN
    RAISE EXCEPTION 'Akun platform tidak dapat diubah dari panel ini' USING ERRCODE = '42501';
  END IF;
  PERFORM public.platform_assert_school_admin_target(p_target_user_id);
  UPDATE public.users SET is_active = p_is_active, updated_at = now() WHERE id = p_target_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Akun tidak ditemukan' USING ERRCODE = 'P0002'; END IF;
  IF NOT p_is_active THEN UPDATE public.sessions SET revoked_at = now() WHERE user_id = p_target_user_id AND revoked_at IS NULL; END IF;
  INSERT INTO public.platform_audit_logs(actor_user_id, action, entity_type, entity_id)
  VALUES(p_actor_user_id, CASE WHEN p_is_active THEN 'platform.account_reactivated' ELSE 'platform.account_suspended' END, 'user', p_target_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_revoke_account_sessions(p_actor_user_id uuid, p_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM public.platform_assert_admin(p_actor_user_id);
  IF p_target_user_id = p_actor_user_id OR EXISTS (SELECT 1 FROM public.platform_administrators WHERE user_id = p_target_user_id) THEN
    RAISE EXCEPTION 'Sesi akun platform tidak dapat diubah dari panel ini' USING ERRCODE = '42501';
  END IF;
  PERFORM public.platform_assert_school_admin_target(p_target_user_id);
  UPDATE public.sessions SET revoked_at = now() WHERE user_id = p_target_user_id AND revoked_at IS NULL;
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_target_user_id) THEN RAISE EXCEPTION 'Akun tidak ditemukan' USING ERRCODE = 'P0002'; END IF;
  INSERT INTO public.platform_audit_logs(actor_user_id, action, entity_type, entity_id)
  VALUES(p_actor_user_id, 'platform.account_sessions_revoked', 'user', p_target_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.platform_assert_school_admin_target(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.platform_set_account_status(uuid, uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.platform_revoke_account_sessions(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.platform_set_account_status(uuid, uuid, boolean) TO ramu_app;
GRANT EXECUTE ON FUNCTION public.platform_revoke_account_sessions(uuid, uuid) TO ramu_app;
GRANT EXECUTE ON FUNCTION public.platform_set_account_status(uuid, uuid, boolean) TO ramu_runtime_permissions;
GRANT EXECUTE ON FUNCTION public.platform_revoke_account_sessions(uuid, uuid) TO ramu_runtime_permissions;
