-- A platform administrator may recover only the School Admin that owns a
-- tenant. Staff accounts remain outside the platform password-management API.
CREATE OR REPLACE FUNCTION public.platform_set_tenant_admin_password(
  p_actor_user_id uuid,
  p_school_id uuid,
  p_admin_user_id uuid,
  p_password_hash text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM public.platform_assert_admin(p_actor_user_id);

  IF NOT EXISTS (
    SELECT 1
    FROM public.school_memberships membership
    JOIN public.users account ON account.id = membership.user_id
    WHERE membership.school_id = p_school_id
      AND membership.user_id = p_admin_user_id
      AND membership.role = 'SCHOOL_ADMIN'
      AND NOT EXISTS (
        SELECT 1
        FROM public.platform_administrators administrator
        WHERE administrator.user_id = account.id
      )
  ) THEN
    RAISE EXCEPTION 'Akun tersebut bukan Admin Sekolah untuk tenant ini' USING ERRCODE = '42501';
  END IF;

  UPDATE public.users
  SET password_hash = p_password_hash,
      must_change_password = true,
      updated_at = now()
  WHERE id = p_admin_user_id;

  UPDATE public.sessions
  SET revoked_at = now()
  WHERE user_id = p_admin_user_id
    AND revoked_at IS NULL;

  INSERT INTO public.platform_audit_logs(actor_user_id, action, entity_type, entity_id)
  VALUES (p_actor_user_id, 'platform.tenant_admin_password_reset', 'user', p_admin_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.platform_set_tenant_admin_password(uuid, uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.platform_set_tenant_admin_password(uuid, uuid, uuid, text) TO ramu_app;
