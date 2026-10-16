-- Parent access is intentionally available without a school-scoped staff
-- session. These functions therefore run as their owner and must not inherit
-- a writable search path or PostgreSQL's default PUBLIC EXECUTE privilege.

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM ramu_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.verify_parent_report(p_token text, p_pin text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  access_row public.report_access%ROWTYPE;
BEGIN
  SELECT *
  INTO access_row
  FROM public.report_access
  WHERE token_hash = encode(public.digest(p_token, 'sha256'), 'hex')
  FOR UPDATE;

  IF NOT FOUND
    OR access_row.status = 'REVOKED'
    OR (access_row.expires_at IS NOT NULL AND access_row.expires_at <= now()) THEN
    RETURN NULL;
  END IF;

  IF access_row.status = 'LOCKED' THEN
    IF access_row.locked_until IS NULL OR access_row.locked_until > now() THEN
      RETURN NULL;
    END IF;

    UPDATE public.report_access
    SET status = 'ACTIVE', failed_attempts = 0, locked_until = NULL
    WHERE id = access_row.id;

    access_row.status := 'ACTIVE';
    access_row.failed_attempts := 0;
  END IF;

  IF access_row.pin_hash <> encode(public.digest(p_pin, 'sha256'), 'hex') THEN
    UPDATE public.report_access
    SET
      failed_attempts = failed_attempts + 1,
      status = CASE WHEN failed_attempts + 1 >= 5 THEN 'LOCKED' ELSE 'ACTIVE' END,
      locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE NULL END
    WHERE id = access_row.id;
    RETURN NULL;
  END IF;

  UPDATE public.report_access
  SET failed_attempts = 0, locked_until = NULL
  WHERE id = access_row.id AND (failed_attempts <> 0 OR locked_until IS NOT NULL);

  RETURN jsonb_build_object('reportVersionId', access_row.report_version_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_parent_report(p_session_token text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT version.snapshot
  FROM public.parent_report_sessions session
  JOIN public.report_versions version ON version.id = session.report_version_id
  WHERE session.token_hash = encode(public.digest(p_session_token, 'sha256'), 'hex')
    AND session.expires_at > now()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_parent_report_pdf_key(p_session_token text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT version.pdf_storage_key
  FROM public.parent_report_sessions session
  JOIN public.report_versions version ON version.id = session.report_version_id
  WHERE session.token_hash = encode(public.digest(p_session_token, 'sha256'), 'hex')
    AND session.expires_at > now()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.verify_parent_report(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_parent_report(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_parent_report_pdf_key(text) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.verify_parent_report(text, text) FROM ramu_app;
REVOKE ALL ON FUNCTION public.get_parent_report(text) FROM ramu_app;
REVOKE ALL ON FUNCTION public.get_parent_report_pdf_key(text) FROM ramu_app;

GRANT EXECUTE ON FUNCTION public.verify_parent_report(text, text) TO ramu_app;
GRANT EXECUTE ON FUNCTION public.get_parent_report(text) TO ramu_app;
GRANT EXECUTE ON FUNCTION public.get_parent_report_pdf_key(text) TO ramu_app;
