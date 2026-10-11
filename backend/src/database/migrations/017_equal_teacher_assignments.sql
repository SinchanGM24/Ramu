-- Teachers assigned to a class are peers; no teacher is designated as primary.
DROP INDEX IF EXISTS active_primary_teacher_unique;
UPDATE teacher_class_assignments SET is_primary = false WHERE is_primary;
ALTER TABLE teacher_class_assignments ALTER COLUMN is_primary SET DEFAULT false;
