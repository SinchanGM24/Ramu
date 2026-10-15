ALTER TABLE lifecycle_requests
  ADD COLUMN IF NOT EXISTS resubmitted_from_request_id uuid
  REFERENCES lifecycle_requests(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_lifecycle_requests_resubmission
  ON lifecycle_requests(school_id,resubmitted_from_request_id)
  WHERE resubmitted_from_request_id IS NOT NULL;
