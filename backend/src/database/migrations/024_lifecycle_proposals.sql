-- Teacher lifecycle requests are reviewed before changing a student's placement or status.
ALTER TABLE lifecycle_operations ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'APPLIED';
ALTER TABLE lifecycle_operations ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES users(id);
ALTER TABLE lifecycle_operations ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE lifecycle_operations ADD COLUMN IF NOT EXISTS review_note text;
ALTER TABLE lifecycle_operations ADD COLUMN IF NOT EXISTS payload jsonb;
ALTER TABLE lifecycle_operations DROP CONSTRAINT IF EXISTS lifecycle_operations_status_check;
ALTER TABLE lifecycle_operations ADD CONSTRAINT lifecycle_operations_status_check CHECK (status IN ('PENDING','APPROVED','REJECTED','APPLIED'));
CREATE INDEX IF NOT EXISTS idx_lifecycle_operations_review_queue ON lifecycle_operations(school_id,status,created_at DESC);
