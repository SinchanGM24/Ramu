CREATE TABLE IF NOT EXISTS student_admission_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES users(id),
  target_class_period_id uuid NOT NULL REFERENCES class_periods(id) ON DELETE RESTRICT,
  payload jsonb NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  reviewed_by uuid REFERENCES users(id), reviewed_at timestamptz, review_note text,
  created_student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_student_admission_requests_queue ON student_admission_requests(school_id,status,created_at DESC);
ALTER TABLE student_admission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_admission_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY student_admission_requests_isolation ON student_admission_requests USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON student_admission_requests TO ramu_app;
