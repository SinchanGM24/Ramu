-- A teacher proposal is not an applied administrative operation.
CREATE TABLE lifecycle_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  request_type varchar(30) NOT NULL CHECK (request_type IN ('TRANSFER','CONTINUATION','GRADUATION')),
  requested_by uuid NOT NULL REFERENCES users(id),
  reason text,
  payload jsonb NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  review_note text,
  applied_operation_id uuid REFERENCES lifecycle_operations(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Preserve legacy teacher proposals before lifecycle_operations becomes applied-only.
INSERT INTO lifecycle_requests (id,school_id,request_type,requested_by,reason,payload,status,reviewed_by,reviewed_at,review_note,applied_operation_id,created_at,updated_at)
SELECT id,school_id,operation_type,actor_user_id,reason,payload,
  CASE WHEN status='APPLIED' THEN 'APPROVED' ELSE status END,
  reviewed_by,reviewed_at,review_note,
  CASE WHEN status IN ('APPROVED','APPLIED') THEN id ELSE NULL END,
  created_at,created_at
FROM lifecycle_operations
WHERE status IN ('PENDING','APPROVED','REJECTED') AND payload IS NOT NULL
ON CONFLICT (id) DO NOTHING;

ALTER TABLE lifecycle_operations DROP CONSTRAINT IF EXISTS lifecycle_operations_status_check;
ALTER TABLE lifecycle_operations DROP COLUMN IF EXISTS status;
ALTER TABLE lifecycle_operations DROP COLUMN IF EXISTS reviewed_by;
ALTER TABLE lifecycle_operations DROP COLUMN IF EXISTS reviewed_at;
ALTER TABLE lifecycle_operations DROP COLUMN IF EXISTS review_note;
ALTER TABLE lifecycle_operations DROP COLUMN IF EXISTS payload;

CREATE INDEX idx_lifecycle_requests_review_queue ON lifecycle_requests(school_id,status,created_at DESC);
ALTER TABLE lifecycle_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifecycle_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY lifecycle_requests_isolation ON lifecycle_requests USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON lifecycle_requests TO ramu_app;
