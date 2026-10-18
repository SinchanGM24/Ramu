-- Persistent publication jobs keep batch publication independent from the
-- browser connection. Each job item is scoped to one report and can be
-- retried without recreating a published report version.

CREATE TABLE report_publication_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  semester_id uuid REFERENCES semesters(id) ON DELETE SET NULL,
  status varchar(20) NOT NULL DEFAULT 'QUEUED'
    CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED')),
  total_count integer NOT NULL DEFAULT 0 CHECK (total_count >= 0),
  completed_count integer NOT NULL DEFAULT 0 CHECK (completed_count >= 0),
  failed_count integer NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  locked_until timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE report_publication_job_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES report_publication_jobs(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  status varchar(20) NOT NULL DEFAULT 'QUEUED'
    CHECK (status IN ('QUEUED', 'PROCESSING', 'PUBLISHED', 'FAILED')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  published_version_id uuid REFERENCES report_versions(id) ON DELETE SET NULL,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, report_id)
);

CREATE INDEX idx_report_publication_jobs_claim
  ON report_publication_jobs (status, locked_until, created_at)
  WHERE status IN ('QUEUED', 'PROCESSING');
CREATE INDEX idx_report_publication_jobs_school_created
  ON report_publication_jobs (school_id, created_at DESC);
CREATE INDEX idx_report_publication_job_items_claim
  ON report_publication_job_items (job_id, status, next_attempt_at, created_at);

ALTER TABLE report_publication_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_publication_job_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_publication_jobs_isolation ON report_publication_jobs
  USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
CREATE POLICY report_publication_job_items_isolation ON report_publication_job_items
  USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE ON report_publication_jobs, report_publication_job_items TO ramu_app;

-- Only the internal worker calls this function. The SECURITY DEFINER boundary
-- is necessary because no authenticated school context exists while claiming
-- the next cross-tenant job; processing then resumes in a tenant transaction.
CREATE OR REPLACE FUNCTION claim_next_report_publication_job()
RETURNS TABLE(job_id uuid, school_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidate AS (
    SELECT id
    FROM report_publication_jobs
    WHERE status = 'QUEUED'
       OR (status = 'PROCESSING' AND locked_until < now())
    ORDER BY created_at
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
