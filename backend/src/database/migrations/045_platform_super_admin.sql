-- Platform administration is deliberately separate from school memberships.
-- A platform administrator never receives a tenant context merely by logging in.

CREATE TYPE tenant_status AS ENUM ('ACTIVE', 'SUSPENDED');

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS tenant_status tenant_status NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE platform_administrators (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  singleton boolean NOT NULL DEFAULT true UNIQUE CHECK (singleton),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE platform_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES platform_administrators(user_id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_sessions_active
  ON platform_sessions(token_hash, expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE platform_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(120) NOT NULL,
  entity_type varchar(80) NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_audit_logs_created
  ON platform_audit_logs(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_subscription_per_school
  ON subscriptions(school_id);

-- The legacy membership enum retains SUPER_ADMIN for migration compatibility,
-- but platform administrators must not be created as school memberships.
ALTER TABLE school_memberships
  ADD CONSTRAINT school_memberships_no_platform_admin_role
  CHECK (role <> 'SUPER_ADMIN') NOT VALID;
ALTER TABLE school_memberships
  VALIDATE CONSTRAINT school_memberships_no_platform_admin_role;

CREATE OR REPLACE FUNCTION public.platform_assert_admin(p_actor_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.platform_administrators administrator
    JOIN public.users account ON account.id = administrator.user_id
    WHERE administrator.user_id = p_actor_user_id
      AND account.is_active
  ) THEN
    RAISE EXCEPTION 'Akses platform tidak valid' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_overview(p_actor_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM public.platform_assert_admin(p_actor_user_id);
  RETURN jsonb_build_object(
    'activeTenants', (SELECT count(*) FROM public.schools WHERE tenant_status = 'ACTIVE'),
    'suspendedTenants', (SELECT count(*) FROM public.schools WHERE tenant_status = 'SUSPENDED'),
    'activeAccounts', (SELECT count(*) FROM public.users WHERE is_active AND NOT EXISTS (SELECT 1 FROM public.platform_administrators administrator WHERE administrator.user_id = users.id)),
    'suspendedAccounts', (SELECT count(*) FROM public.users WHERE NOT is_active AND NOT EXISTS (SELECT 1 FROM public.platform_administrators administrator WHERE administrator.user_id = users.id)),
    'recentActivity', COALESCE((
      SELECT jsonb_agg(activity ORDER BY (activity ->> 'createdAt') DESC)
      FROM (
        SELECT jsonb_build_object(
          'id', log.id,
          'action', log.action,
          'entityType', log.entity_type,
          'createdAt', log.created_at
        ) AS activity
        FROM public.platform_audit_logs log
        ORDER BY log.created_at DESC
        LIMIT 8
      ) recent
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_list_tenants(
  p_actor_user_id uuid,
  p_query text,
  p_status text,
  p_limit integer,
  p_offset integer
)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  tenant_status text,
  created_at timestamptz,
  admin_name text,
  admin_email text,
  student_count integer,
  account_count integer,
  subscription_plan text,
  subscription_status text,
  total_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM public.platform_assert_admin(p_actor_user_id);
  RETURN QUERY
  SELECT
    school.id,
    school.name::text,
    school.slug::text,
    school.tenant_status::text,
    school.created_at,
    administrator.name::text,
    administrator.email::text,
    (SELECT count(*)::integer FROM public.students student WHERE student.school_id = school.id),
    (SELECT count(*)::integer FROM public.school_memberships membership WHERE membership.school_id = school.id AND membership.is_active),
    subscription.plan::text,
    subscription.status::text,
    count(*) OVER ()::integer
  FROM public.schools school
  LEFT JOIN LATERAL (
    SELECT account.name, account.email
    FROM public.school_memberships membership
    JOIN public.users account ON account.id = membership.user_id
    WHERE membership.school_id = school.id
      AND membership.role = 'SCHOOL_ADMIN'
    LIMIT 1
  ) administrator ON true
  LEFT JOIN public.subscriptions subscription ON subscription.school_id = school.id
  WHERE (coalesce(p_query, '') = '' OR school.name ILIKE '%' || p_query || '%' OR school.slug ILIKE '%' || p_query || '%' OR administrator.email ILIKE '%' || p_query || '%')
    AND (coalesce(p_status, '') = '' OR school.tenant_status::text = p_status)
  ORDER BY school.created_at DESC
  LIMIT greatest(1, least(p_limit, 50))
  OFFSET greatest(p_offset, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_tenant_detail(p_actor_user_id uuid, p_school_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  result jsonb;
BEGIN
  PERFORM public.platform_assert_admin(p_actor_user_id);
  SELECT jsonb_build_object(
    'id', school.id,
    'name', school.name,
    'slug', school.slug,
    'address', school.address,
    'phone', school.phone,
    'status', school.tenant_status,
    'createdAt', school.created_at,
    'admin', (
      SELECT jsonb_build_object('id', account.id, 'name', account.name, 'email', account.email, 'isActive', account.is_active)
      FROM public.school_memberships membership
      JOIN public.users account ON account.id = membership.user_id
      WHERE membership.school_id = school.id AND membership.role = 'SCHOOL_ADMIN'
      LIMIT 1
    ),
    'studentCount', (SELECT count(*) FROM public.students student WHERE student.school_id = school.id),
    'accountCount', (SELECT count(*) FROM public.school_memberships membership WHERE membership.school_id = school.id AND membership.is_active),
    'subscription', (
      SELECT jsonb_build_object('plan', subscription.plan, 'status', subscription.status)
      FROM public.subscriptions subscription WHERE subscription.school_id = school.id
    )
  ) INTO result
  FROM public.schools school
  WHERE school.id = p_school_id;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_create_tenant(
  p_actor_user_id uuid,
  p_school_name text,
  p_admin_name text,
  p_admin_email text,
  p_password_hash text,
  p_address text,
  p_phone text
)
RETURNS TABLE(school_id uuid, admin_user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  created_school_id uuid := gen_random_uuid();
  created_admin_user_id uuid;
  created_slug text;
BEGIN
  PERFORM public.platform_assert_admin(p_actor_user_id);
  IF EXISTS (SELECT 1 FROM public.users WHERE lower(email) = lower(p_admin_email)) THEN
    RAISE EXCEPTION 'Email sudah digunakan oleh akun lain' USING ERRCODE = '23505';
  END IF;

  created_slug := lower(regexp_replace(trim(p_school_name), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(created_school_id::text, 1, 8);
  INSERT INTO public.schools(id, name, slug, address, phone)
  VALUES(created_school_id, trim(p_school_name), created_slug, nullif(trim(p_address), ''), nullif(trim(p_phone), ''));
  INSERT INTO public.users(name, email, password_hash, must_change_password)
  VALUES(trim(p_admin_name), lower(trim(p_admin_email)), p_password_hash, true)
  RETURNING id INTO created_admin_user_id;
  INSERT INTO public.school_memberships(user_id, school_id, role)
  VALUES(created_admin_user_id, created_school_id, 'SCHOOL_ADMIN');
  INSERT INTO public.subscriptions(school_id, plan, status)
  VALUES(created_school_id, 'TRIAL', 'ACTIVE');
  INSERT INTO public.platform_audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  VALUES(p_actor_user_id, 'platform.tenant_created', 'school', created_school_id, jsonb_build_object('adminUserId', created_admin_user_id));
  RETURN QUERY SELECT created_school_id, created_admin_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_set_tenant_status(p_actor_user_id uuid, p_school_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM public.platform_assert_admin(p_actor_user_id);
  IF p_status NOT IN ('ACTIVE', 'SUSPENDED') THEN
    RAISE EXCEPTION 'Status tenant tidak valid' USING ERRCODE = '22023';
  END IF;
  UPDATE public.schools
  SET tenant_status = p_status::public.tenant_status,
      suspended_at = CASE WHEN p_status = 'SUSPENDED' THEN now() ELSE NULL END,
      suspended_by = CASE WHEN p_status = 'SUSPENDED' THEN p_actor_user_id ELSE NULL END,
      updated_at = now()
  WHERE id = p_school_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tenant tidak ditemukan' USING ERRCODE = 'P0002'; END IF;
  IF p_status = 'SUSPENDED' THEN
    UPDATE public.sessions SET revoked_at = now() WHERE school_id = p_school_id AND revoked_at IS NULL;
  END IF;
  INSERT INTO public.platform_audit_logs(actor_user_id, action, entity_type, entity_id)
  VALUES(p_actor_user_id, CASE WHEN p_status = 'SUSPENDED' THEN 'platform.tenant_suspended' ELSE 'platform.tenant_reactivated' END, 'school', p_school_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_list_accounts(
  p_actor_user_id uuid,
  p_query text,
  p_status text,
  p_school_id uuid,
  p_role text,
  p_limit integer,
  p_offset integer
)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  school_id uuid,
  school_name text,
  role text,
  is_active boolean,
  created_at timestamptz,
  total_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM public.platform_assert_admin(p_actor_user_id);
  RETURN QUERY
  SELECT account.id, account.name::text, account.email::text, school.id, school.name::text,
    membership.role::text, account.is_active, account.created_at, count(*) OVER ()::integer
  FROM public.school_memberships membership
  JOIN public.users account ON account.id = membership.user_id
  JOIN public.schools school ON school.id = membership.school_id
  WHERE NOT EXISTS (SELECT 1 FROM public.platform_administrators administrator WHERE administrator.user_id = account.id)
    AND (coalesce(p_query, '') = '' OR account.name ILIKE '%' || p_query || '%' OR account.email ILIKE '%' || p_query || '%' OR school.name ILIKE '%' || p_query || '%')
    AND (coalesce(p_status, '') = '' OR (p_status = 'ACTIVE' AND account.is_active) OR (p_status = 'SUSPENDED' AND NOT account.is_active))
    AND (p_school_id IS NULL OR school.id = p_school_id)
    AND (coalesce(p_role, '') = '' OR membership.role::text = p_role)
  ORDER BY account.created_at DESC
  LIMIT greatest(1, least(p_limit, 50))
  OFFSET greatest(p_offset, 0);
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
  UPDATE public.sessions SET revoked_at = now() WHERE user_id = p_target_user_id AND revoked_at IS NULL;
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_target_user_id) THEN RAISE EXCEPTION 'Akun tidak ditemukan' USING ERRCODE = 'P0002'; END IF;
  INSERT INTO public.platform_audit_logs(actor_user_id, action, entity_type, entity_id)
  VALUES(p_actor_user_id, 'platform.account_sessions_revoked', 'user', p_target_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.platform_assert_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.platform_overview(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.platform_list_tenants(uuid, text, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.platform_tenant_detail(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.platform_create_tenant(uuid, text, text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.platform_set_tenant_status(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.platform_list_accounts(uuid, text, text, uuid, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.platform_set_account_status(uuid, uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.platform_revoke_account_sessions(uuid, uuid) FROM PUBLIC;

-- Do not inherit the broad default table grants for platform administration.
-- The runtime only needs to create/revoke platform sessions and verify the
-- platform identity; all platform mutations and audit writes use the narrow
-- security-definer functions above.
REVOKE ALL ON platform_sessions, platform_audit_logs, platform_administrators FROM ramu_app;
GRANT SELECT, INSERT, UPDATE ON platform_sessions TO ramu_app;
GRANT SELECT ON platform_administrators TO ramu_app;
GRANT EXECUTE ON FUNCTION public.platform_overview(uuid) TO ramu_app;
GRANT EXECUTE ON FUNCTION public.platform_list_tenants(uuid, text, text, integer, integer) TO ramu_app;
GRANT EXECUTE ON FUNCTION public.platform_tenant_detail(uuid, uuid) TO ramu_app;
GRANT EXECUTE ON FUNCTION public.platform_create_tenant(uuid, text, text, text, text, text, text) TO ramu_app;
GRANT EXECUTE ON FUNCTION public.platform_set_tenant_status(uuid, uuid, text) TO ramu_app;
GRANT EXECUTE ON FUNCTION public.platform_list_accounts(uuid, text, text, uuid, text, integer, integer) TO ramu_app;
GRANT EXECUTE ON FUNCTION public.platform_set_account_status(uuid, uuid, boolean) TO ramu_app;
GRANT EXECUTE ON FUNCTION public.platform_revoke_account_sessions(uuid, uuid) TO ramu_app;

-- Parent functions remain the only unauthenticated read path to a report, but
-- suspended tenants must not expose a snapshot or stored PDF.
CREATE OR REPLACE FUNCTION public.verify_parent_report(p_token text, p_pin text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE access_row public.report_access%ROWTYPE;
BEGIN
  SELECT access.* INTO access_row
  FROM public.report_access access
  JOIN public.schools school ON school.id = access.school_id AND school.tenant_status = 'ACTIVE'
  WHERE access.token_hash = encode(public.digest(p_token, 'sha256'), 'hex')
  FOR UPDATE OF access;
  IF NOT FOUND OR access_row.status = 'REVOKED' OR (access_row.expires_at IS NOT NULL AND access_row.expires_at <= now()) THEN RETURN NULL; END IF;
  IF access_row.status = 'LOCKED' THEN
    IF access_row.locked_until IS NULL OR access_row.locked_until > now() THEN RETURN NULL; END IF;
    UPDATE public.report_access SET status = 'ACTIVE', failed_attempts = 0, locked_until = NULL WHERE id = access_row.id;
  END IF;
  IF access_row.pin_hash <> encode(public.digest(p_pin, 'sha256'), 'hex') THEN
    UPDATE public.report_access SET failed_attempts = failed_attempts + 1, status = CASE WHEN failed_attempts + 1 >= 5 THEN 'LOCKED' ELSE 'ACTIVE' END, locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE NULL END WHERE id = access_row.id;
    RETURN NULL;
  END IF;
  UPDATE public.report_access SET failed_attempts = 0, locked_until = NULL WHERE id = access_row.id AND (failed_attempts <> 0 OR locked_until IS NOT NULL);
  RETURN jsonb_build_object('reportVersionId', access_row.report_version_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_parent_report(p_session_token text)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT version.snapshot FROM public.parent_report_sessions session JOIN public.report_versions version ON version.id = session.report_version_id JOIN public.schools school ON school.id = version.school_id AND school.tenant_status = 'ACTIVE' WHERE session.token_hash = encode(public.digest(p_session_token, 'sha256'), 'hex') AND session.expires_at > now() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_parent_report_pdf_key(p_session_token text)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT version.pdf_storage_key FROM public.parent_report_sessions session JOIN public.report_versions version ON version.id = session.report_version_id JOIN public.schools school ON school.id = version.school_id AND school.tenant_status = 'ACTIVE' WHERE session.token_hash = encode(public.digest(p_session_token, 'sha256'), 'hex') AND session.expires_at > now() LIMIT 1;
$$;
