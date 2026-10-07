CREATE TABLE portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  semester_id uuid NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  original_filename varchar(255) NOT NULL,
  content_type varchar(100) NOT NULL,
  byte_size integer NOT NULL CHECK (byte_size > 0),
  caption varchar(500),
  included_in_report boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_portfolio_items_report ON portfolio_items(school_id,report_id,created_at DESC);
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY; ALTER TABLE portfolio_items FORCE ROW LEVEL SECURITY;
CREATE POLICY portfolio_items_isolation ON portfolio_items USING (school_id = NULLIF(current_setting('app.school_id',true),'')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id',true),'')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON portfolio_items TO ramu_app;
