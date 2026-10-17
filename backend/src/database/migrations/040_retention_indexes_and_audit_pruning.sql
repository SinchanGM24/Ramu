-- Cleanup queries run on expiry/revocation timestamps. Keep their indexes
-- narrow so routine maintenance does not scan growing session/audit tables.
CREATE INDEX IF NOT EXISTS idx_sessions_expired_cleanup
  ON sessions (expires_at)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_revoked_cleanup
  ON sessions (revoked_at)
  WHERE revoked_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_parent_report_sessions_expired_cleanup
  ON parent_report_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs (created_at);

-- audit_logs has tenant RLS, so the runtime app role cannot safely perform a
-- global retention purge with a plain DELETE. This tightly scoped function is
-- the only privileged path: it accepts a bounded retention period and deletes
-- only audit rows older than that period.
CREATE OR REPLACE FUNCTION public.prune_expired_audit_logs(
  p_retention_days integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  deleted_count integer;
BEGIN
  IF p_retention_days < 30 OR p_retention_days > 36500 THEN
    RAISE EXCEPTION 'Audit retention days must be between 30 and 36500';
  END IF;

  DELETE FROM public.audit_logs
  WHERE created_at < now() - make_interval(days => p_retention_days);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.prune_expired_audit_logs(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prune_expired_audit_logs(integer) FROM ramu_app;
GRANT EXECUTE ON FUNCTION public.prune_expired_audit_logs(integer) TO ramu_app;
