ALTER TABLE student_admission_requests
  ADD COLUMN IF NOT EXISTS resubmitted_from_request_id uuid
  REFERENCES student_admission_requests(id) ON DELETE RESTRICT;

-- A rejected request starts one auditable correction chain. If that correction
-- is rejected again, the teacher must correct the newest rejected request.
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_admission_request_one_resubmission
  ON student_admission_requests(resubmitted_from_request_id)
  WHERE resubmitted_from_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_student_admission_requests_resubmission
  ON student_admission_requests(school_id, resubmitted_from_request_id)
  WHERE resubmitted_from_request_id IS NOT NULL;
