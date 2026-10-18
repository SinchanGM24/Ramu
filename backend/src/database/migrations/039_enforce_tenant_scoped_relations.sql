-- A UUID foreign key alone proves that a row exists, but not that it belongs
-- to the same school. These composite keys make the tenant boundary a
-- database invariant for the relationships that carry student/report data.
-- Existing single-column foreign keys remain to preserve delete semantics.

ALTER TABLE students
  ADD CONSTRAINT students_school_id_id_unique UNIQUE (school_id, id);
ALTER TABLE academic_years
  ADD CONSTRAINT academic_years_school_id_id_unique UNIQUE (school_id, id);
ALTER TABLE semesters
  ADD CONSTRAINT semesters_school_id_id_unique UNIQUE (school_id, id);
ALTER TABLE class_groups
  ADD CONSTRAINT class_groups_school_id_id_unique UNIQUE (school_id, id);
ALTER TABLE class_periods
  ADD CONSTRAINT class_periods_school_id_id_unique UNIQUE (school_id, id);
ALTER TABLE student_enrollments
  ADD CONSTRAINT student_enrollments_school_id_id_unique UNIQUE (school_id, id);
ALTER TABLE assessment_scale_options
  ADD CONSTRAINT assessment_scale_options_school_id_id_unique UNIQUE (school_id, id);
ALTER TABLE development_areas
  ADD CONSTRAINT development_areas_school_id_id_unique UNIQUE (school_id, id);
ALTER TABLE indicators
  ADD CONSTRAINT indicators_school_id_id_unique UNIQUE (school_id, id);
ALTER TABLE reports
  ADD CONSTRAINT reports_school_id_id_unique UNIQUE (school_id, id);
ALTER TABLE report_versions
  ADD CONSTRAINT report_versions_school_id_id_unique UNIQUE (school_id, id);
ALTER TABLE report_access
  ADD CONSTRAINT report_access_school_id_id_unique UNIQUE (school_id, id);
ALTER TABLE guardian_contacts
  ADD CONSTRAINT guardian_contacts_school_id_id_unique UNIQUE (school_id, id);
ALTER TABLE lifecycle_operations
  ADD CONSTRAINT lifecycle_operations_school_id_id_unique UNIQUE (school_id, id);

ALTER TABLE guardian_contacts
  ADD CONSTRAINT guardian_contacts_student_same_school_fkey
  FOREIGN KEY (school_id, student_id)
  REFERENCES students (school_id, id) ON DELETE CASCADE;

ALTER TABLE student_enrollments
  ADD CONSTRAINT enrollments_student_same_school_fkey
  FOREIGN KEY (school_id, student_id)
  REFERENCES students (school_id, id) ON DELETE CASCADE,
  ADD CONSTRAINT enrollments_academic_year_same_school_fkey
  FOREIGN KEY (school_id, academic_year_id)
  REFERENCES academic_years (school_id, id) ON DELETE RESTRICT,
  ADD CONSTRAINT enrollments_class_period_same_school_fkey
  FOREIGN KEY (school_id, class_period_id)
  REFERENCES class_periods (school_id, id) ON DELETE SET NULL;

ALTER TABLE teacher_class_assignments
  ADD CONSTRAINT teacher_assignments_class_period_same_school_fkey
  FOREIGN KEY (school_id, class_period_id)
  REFERENCES class_periods (school_id, id) ON DELETE CASCADE;

ALTER TABLE student_assessments
  ADD CONSTRAINT student_assessments_student_same_school_fkey
  FOREIGN KEY (school_id, student_id)
  REFERENCES students (school_id, id) ON DELETE CASCADE,
  ADD CONSTRAINT student_assessments_semester_same_school_fkey
  FOREIGN KEY (school_id, semester_id)
  REFERENCES semesters (school_id, id) ON DELETE CASCADE,
  ADD CONSTRAINT student_assessments_indicator_same_school_fkey
  FOREIGN KEY (school_id, indicator_id)
  REFERENCES indicators (school_id, id) ON DELETE CASCADE,
  ADD CONSTRAINT student_assessments_scale_option_same_school_fkey
  FOREIGN KEY (school_id, scale_option_id)
  REFERENCES assessment_scale_options (school_id, id);

ALTER TABLE reports
  ADD CONSTRAINT reports_student_same_school_fkey
  FOREIGN KEY (school_id, student_id)
  REFERENCES students (school_id, id) ON DELETE CASCADE,
  ADD CONSTRAINT reports_semester_same_school_fkey
  FOREIGN KEY (school_id, semester_id)
  REFERENCES semesters (school_id, id) ON DELETE CASCADE,
  ADD CONSTRAINT reports_enrollment_same_school_fkey
  FOREIGN KEY (school_id, student_enrollment_id)
  REFERENCES student_enrollments (school_id, id) ON DELETE RESTRICT;

ALTER TABLE report_narratives
  ADD CONSTRAINT report_narratives_report_same_school_fkey
  FOREIGN KEY (school_id, report_id)
  REFERENCES reports (school_id, id) ON DELETE CASCADE,
  ADD CONSTRAINT report_narratives_area_same_school_fkey
  FOREIGN KEY (school_id, development_area_id)
  REFERENCES development_areas (school_id, id);

ALTER TABLE report_versions
  ADD CONSTRAINT report_versions_report_same_school_fkey
  FOREIGN KEY (school_id, report_id)
  REFERENCES reports (school_id, id) ON DELETE CASCADE;

ALTER TABLE report_access
  ADD CONSTRAINT report_access_version_same_school_fkey
  FOREIGN KEY (school_id, report_version_id)
  REFERENCES report_versions (school_id, id) ON DELETE CASCADE;

ALTER TABLE report_deliveries
  ADD CONSTRAINT report_deliveries_version_same_school_fkey
  FOREIGN KEY (school_id, report_version_id)
  REFERENCES report_versions (school_id, id) ON DELETE CASCADE,
  ADD CONSTRAINT report_deliveries_guardian_same_school_fkey
  FOREIGN KEY (school_id, guardian_contact_id)
  REFERENCES guardian_contacts (school_id, id) ON DELETE RESTRICT,
  ADD CONSTRAINT report_deliveries_access_same_school_fkey
  FOREIGN KEY (school_id, report_access_id)
  REFERENCES report_access (school_id, id) ON DELETE SET NULL;

ALTER TABLE portfolio_items
  ADD CONSTRAINT portfolio_items_report_same_school_fkey
  FOREIGN KEY (school_id, report_id)
  REFERENCES reports (school_id, id) ON DELETE CASCADE,
  ADD CONSTRAINT portfolio_items_student_same_school_fkey
  FOREIGN KEY (school_id, student_id)
  REFERENCES students (school_id, id) ON DELETE CASCADE,
  ADD CONSTRAINT portfolio_items_semester_same_school_fkey
  FOREIGN KEY (school_id, semester_id)
  REFERENCES semesters (school_id, id) ON DELETE CASCADE;

ALTER TABLE student_lifecycle_events
  ADD CONSTRAINT lifecycle_events_student_same_school_fkey
  FOREIGN KEY (school_id, student_id)
  REFERENCES students (school_id, id) ON DELETE RESTRICT,
  ADD CONSTRAINT lifecycle_events_operation_same_school_fkey
  FOREIGN KEY (school_id, operation_id)
  REFERENCES lifecycle_operations (school_id, id) ON DELETE RESTRICT;

ALTER TABLE lifecycle_requests
  ADD CONSTRAINT lifecycle_requests_operation_same_school_fkey
  FOREIGN KEY (school_id, applied_operation_id)
  REFERENCES lifecycle_operations (school_id, id) ON DELETE RESTRICT;

ALTER TABLE student_admission_requests
  ADD CONSTRAINT admission_requests_class_group_same_school_fkey
  FOREIGN KEY (school_id, target_class_group_id)
  REFERENCES class_groups (school_id, id) ON DELETE RESTRICT,
  ADD CONSTRAINT admission_requests_student_same_school_fkey
  FOREIGN KEY (school_id, created_student_id)
  REFERENCES students (school_id, id) ON DELETE SET NULL;
