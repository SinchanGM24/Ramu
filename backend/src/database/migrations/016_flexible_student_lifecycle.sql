-- Flexible, student-centred academic placement.  Existing rows are retained.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS display_year smallint;
UPDATE academic_years
SET display_year = substring(name from '^([0-9]{4})')::smallint,
    name = substring(name from '^([0-9]{4})')
WHERE name ~ '^[0-9]{4}/[0-9]{4}$';
UPDATE academic_years SET display_year = EXTRACT(YEAR FROM starts_on)::smallint WHERE display_year IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS academic_years_school_start_unique ON academic_years(school_id, starts_on);

ALTER TABLE class_groups ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE class_periods ALTER COLUMN education_level_id DROP NOT NULL;

ALTER TABLE teacher_class_assignments DROP CONSTRAINT IF EXISTS teacher_class_assignments_class_period_id_key;
ALTER TABLE teacher_class_assignments ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS active_teacher_assignment_unique ON teacher_class_assignments(class_period_id, teacher_user_id) WHERE ended_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS active_primary_teacher_unique ON teacher_class_assignments(class_period_id) WHERE ended_at IS NULL AND is_primary;

ALTER TABLE students ADD COLUMN IF NOT EXISTS lifecycle_status varchar(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_lifecycle_status_check;
ALTER TABLE students ADD CONSTRAINT students_lifecycle_status_check CHECK (lifecycle_status IN ('ACTIVE','GRADUATED'));

ALTER TABLE student_enrollments DROP CONSTRAINT IF EXISTS student_enrollments_student_id_academic_year_id_key;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS effective_start_on date;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS effective_end_on date;
UPDATE student_enrollments
SET effective_start_on = COALESCE(effective_start_on, started_at::date, CURRENT_DATE),
    effective_end_on = CASE WHEN ended_at IS NULL THEN effective_end_on ELSE COALESCE(effective_end_on, ended_at::date + 1) END;
ALTER TABLE student_enrollments ALTER COLUMN effective_start_on SET NOT NULL;
ALTER TABLE student_enrollments DROP CONSTRAINT IF EXISTS student_enrollments_status_check;
ALTER TABLE student_enrollments ADD CONSTRAINT student_enrollments_status_check CHECK (status IN ('ACTIVE','SCHEDULED','PROMOTED','REPEATED','GRADUATED','TRANSFERRED','WITHDRAWN'));
ALTER TABLE student_enrollments ADD CONSTRAINT student_enrollments_effective_dates_check CHECK (effective_end_on IS NULL OR effective_end_on > effective_start_on);
CREATE INDEX IF NOT EXISTS idx_enrollments_effective_lookup ON student_enrollments(school_id, student_id, academic_year_id, effective_start_on, effective_end_on);
ALTER TABLE student_enrollments DROP CONSTRAINT IF EXISTS student_enrollments_no_overlapping_placements;
ALTER TABLE student_enrollments ADD CONSTRAINT student_enrollments_no_overlapping_placements EXCLUDE USING gist (
  student_id WITH =, academic_year_id WITH =,
  daterange(effective_start_on, COALESCE(effective_end_on, 'infinity'::date), '[)') WITH &&
) WHERE (class_period_id IS NOT NULL);

CREATE TABLE IF NOT EXISTS lifecycle_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  operation_type varchar(30) NOT NULL CHECK (operation_type IN ('TRANSFER','CONTINUATION','GRADUATION','GRADUATION_REVERSAL')),
  actor_user_id uuid NOT NULL REFERENCES users(id), reason text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS student_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  operation_id uuid NOT NULL REFERENCES lifecycle_operations(id) ON DELETE RESTRICT,
  action varchar(40) NOT NULL, effective_on date NOT NULL, previous_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_state jsonb NOT NULL DEFAULT '{}'::jsonb, reason text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_student ON student_lifecycle_events(school_id, student_id, effective_on DESC);

ALTER TABLE lifecycle_operations ENABLE ROW LEVEL SECURITY; ALTER TABLE lifecycle_operations FORCE ROW LEVEL SECURITY;
ALTER TABLE student_lifecycle_events ENABLE ROW LEVEL SECURITY; ALTER TABLE student_lifecycle_events FORCE ROW LEVEL SECURITY;
CREATE POLICY lifecycle_operations_isolation ON lifecycle_operations USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
CREATE POLICY lifecycle_events_isolation ON student_lifecycle_events USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON lifecycle_operations, student_lifecycle_events TO ramu_app;
