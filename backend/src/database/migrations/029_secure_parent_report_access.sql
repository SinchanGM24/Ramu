-- Parent viewers do not have an authenticated school context. These narrowly scoped
-- security-definer functions are the only path from a validated token/PIN or parent
-- session to a published report snapshot or stored PDF key.

CREATE OR REPLACE FUNCTION verify_parent_report(p_token text, p_pin text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  access_row report_access%ROWTYPE;
BEGIN
  SELECT *
  INTO access_row
  FROM report_access
  WHERE token_hash = encode(digest(p_token, 'sha256'), 'hex')
  FOR UPDATE;

  IF NOT FOUND OR access_row.failed_attempts >= 5 THEN
    RETURN NULL;
  END IF;

  IF access_row.pin_hash <> encode(digest(p_pin, 'sha256'), 'hex') THEN
    UPDATE report_access
    SET failed_attempts = failed_attempts + 1
    WHERE id = access_row.id;
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object('reportVersionId', access_row.report_version_id);
END;
$$;

CREATE OR REPLACE FUNCTION get_parent_report(p_session_token text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT version.snapshot
  FROM parent_report_sessions session
  JOIN report_versions version ON version.id = session.report_version_id
  WHERE session.token_hash = encode(digest(p_session_token, 'sha256'), 'hex')
    AND session.expires_at > now()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_parent_report_pdf_key(p_session_token text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT version.pdf_storage_key
  FROM parent_report_sessions session
  JOIN report_versions version ON version.id = session.report_version_id
  WHERE session.token_hash = encode(digest(p_session_token, 'sha256'), 'hex')
    AND session.expires_at > now()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION verify_parent_report(text, text) TO ramu_app;
GRANT EXECUTE ON FUNCTION get_parent_report(text) TO ramu_app;
GRANT EXECUTE ON FUNCTION get_parent_report_pdf_key(text) TO ramu_app;
