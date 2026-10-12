-- Class groups are reusable school names.  Historical class periods stay internal.
ALTER TABLE student_admission_requests ADD COLUMN IF NOT EXISTS target_class_group_id uuid REFERENCES class_groups(id) ON DELETE RESTRICT;
UPDATE student_admission_requests request
SET target_class_group_id = period.class_group_id
FROM class_periods period
WHERE request.target_class_group_id IS NULL AND request.target_class_period_id = period.id;
ALTER TABLE student_admission_requests ALTER COLUMN target_class_group_id SET NOT NULL;
ALTER TABLE student_admission_requests DROP COLUMN IF EXISTS target_class_period_id;

-- All teachers assigned to a class period have equal standing.
DROP INDEX IF EXISTS active_primary_teacher_unique;
ALTER TABLE teacher_class_assignments DROP COLUMN IF EXISTS is_primary;

-- Preserve old placement rows but remove retired promotion/repetition vocabulary.
-- The old constraint does not permit COMPLETED, so remove it before normalizing.
ALTER TABLE student_enrollments DROP CONSTRAINT IF EXISTS student_enrollments_status_check;
UPDATE student_enrollments
SET status = CASE WHEN effective_end_on IS NULL THEN 'ACTIVE' ELSE 'COMPLETED' END
WHERE status IN ('PROMOTED', 'REPEATED');
ALTER TABLE student_enrollments ADD CONSTRAINT student_enrollments_status_check CHECK (status IN ('ACTIVE','SCHEDULED','COMPLETED','GRADUATED','TRANSFERRED','WITHDRAWN'));

-- Levels were retired in favor of freely named reusable classes.
ALTER TABLE class_periods DROP COLUMN IF EXISTS education_level_id;
DROP TABLE IF EXISTS education_levels;
