-- Do not repeatedly claim a job while all of its retryable items are still
-- waiting for backoff. A job becomes claimable only when an item is ready or
-- its processing lease has expired.
CREATE OR REPLACE FUNCTION claim_next_report_publication_job()
RETURNS TABLE(job_id uuid, school_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidate AS (
    SELECT job.id
    FROM report_publication_jobs job
    WHERE (job.status = 'QUEUED' OR (job.status = 'PROCESSING' AND job.locked_until < now()))
      AND EXISTS (
        SELECT 1
        FROM report_publication_job_items item
        WHERE item.job_id = job.id
          AND (
            (item.status = 'QUEUED' AND item.next_attempt_at <= now())
            OR (item.status = 'PROCESSING' AND item.locked_until < now())
          )
      )
    ORDER BY job.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  UPDATE report_publication_jobs job
  SET status = 'PROCESSING',
      attempts = job.attempts + 1,
      started_at = COALESCE(job.started_at, now()),
      locked_until = now() + interval '10 minutes',
      updated_at = now()
  FROM candidate
  WHERE job.id = candidate.id
  RETURNING job.id, job.school_id;
END;
$$;

REVOKE ALL ON FUNCTION claim_next_report_publication_job() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_next_report_publication_job() TO ramu_app;
