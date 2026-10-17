-- Query paths used by the report progress and publication workspaces.
-- These indexes intentionally start with school_id so tenant-scoped reads stay
-- selective as historical enrollments and report versions grow.

CREATE INDEX IF NOT EXISTS idx_students_active_name
  ON students (school_id, name)
  WHERE lifecycle_status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_enrollments_current_year
  ON student_enrollments (school_id, academic_year_id, effective_start_on, student_id, class_period_id)
  WHERE effective_end_on IS NULL;

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_active_lookup
  ON teacher_class_assignments (school_id, class_period_id, teacher_user_id)
  WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_student_assessments_semester_student
  ON student_assessments (school_id, semester_id, student_id);

CREATE INDEX IF NOT EXISTS idx_report_narratives_school_report
  ON report_narratives (school_id, report_id, development_area_id);

CREATE INDEX IF NOT EXISTS idx_report_versions_school_report_latest
  ON report_versions (school_id, report_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_report_deliveries_school_version_updated
  ON report_deliveries (school_id, report_version_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_report_revision_lookup
  ON audit_logs (school_id, entity_type, entity_id, action, created_at DESC);
