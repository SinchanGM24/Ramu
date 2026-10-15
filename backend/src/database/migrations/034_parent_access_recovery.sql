ALTER TABLE report_access
  ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS locked_until timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_by uuid REFERENCES users(id);

ALTER TABLE report_access
  DROP CONSTRAINT IF EXISTS report_access_status_check;

ALTER TABLE report_access
  ADD CONSTRAINT report_access_status_check
  CHECK (status IN ('ACTIVE', 'LOCKED', 'REVOKED'));

UPDATE report_access
SET status = 'ACTIVE'
WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_report_access_recovery
  ON report_access(school_id, report_version_id, status);

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

  IF NOT FOUND
    OR access_row.status = 'REVOKED'
    OR (access_row.expires_at IS NOT NULL AND access_row.expires_at <= now()) THEN
    RETURN NULL;
  END IF;

  IF access_row.status = 'LOCKED' THEN
    IF access_row.locked_until IS NULL OR access_row.locked_until > now() THEN
      RETURN NULL;
    END IF;

    UPDATE report_access
    SET status = 'ACTIVE', failed_attempts = 0, locked_until = NULL
    WHERE id = access_row.id;

    access_row.status := 'ACTIVE';
    access_row.failed_attempts := 0;
  END IF;

  IF access_row.pin_hash <> encode(digest(p_pin, 'sha256'), 'hex') THEN
    UPDATE report_access
    SET
      failed_attempts = failed_attempts + 1,
      status = CASE WHEN failed_attempts + 1 >= 5 THEN 'LOCKED' ELSE 'ACTIVE' END,
      locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE NULL END
    WHERE id = access_row.id;
    RETURN NULL;
  END IF;

  UPDATE report_access
  SET failed_attempts = 0, locked_until = NULL
  WHERE id = access_row.id AND (failed_attempts <> 0 OR locked_until IS NOT NULL);

  RETURN jsonb_build_object('reportVersionId', access_row.report_version_id);
END;
$$;

REVOKE ALL ON FUNCTION verify_parent_report(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_parent_report(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_parent_report_pdf_key(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION verify_parent_report(text, text) TO ramu_app;
GRANT EXECUTE ON FUNCTION get_parent_report(text) TO ramu_app;
GRANT EXECUTE ON FUNCTION get_parent_report_pdf_key(text) TO ramu_app;
