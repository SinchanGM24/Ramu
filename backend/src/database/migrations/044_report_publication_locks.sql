-- A transient lock prevents concurrent publishers from rendering the same
-- approved report. It is not a workflow status and is cleared on success or
-- failure; an expired lock can be recovered by a retrying worker.
ALTER TABLE reports
  ADD COLUMN publication_lock_token uuid,
  ADD COLUMN publication_locked_at timestamptz;

CREATE INDEX idx_reports_publication_lock
  ON reports (school_id, publication_locked_at)
  WHERE publication_lock_token IS NOT NULL;
