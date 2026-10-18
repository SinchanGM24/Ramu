ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;
ALTER TABLE school_memberships ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE school_memberships ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

CREATE TABLE education_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name varchar(80) NOT NULL, code varchar(40) NOT NULL, position smallint NOT NULL,
  next_level_id uuid REFERENCES education_levels(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id, code), UNIQUE(school_id, position)
);
CREATE TABLE class_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(school_id, name)
);
CREATE TABLE class_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_group_id uuid NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  education_level_id uuid NOT NULL REFERENCES education_levels(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(class_group_id, academic_year_id)
);
CREATE TABLE student_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  class_period_id uuid REFERENCES class_periods(id) ON DELETE SET NULL,
  status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','PROMOTED','REPEATED','GRADUATED','TRANSFERRED','WITHDRAWN')),
  started_at timestamptz NOT NULL DEFAULT now(), ended_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, academic_year_id)
);
CREATE TABLE teacher_class_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_period_id uuid NOT NULL REFERENCES class_periods(id) ON DELETE CASCADE,
  teacher_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(), ended_at timestamptz,
  UNIQUE(class_period_id)
);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS student_enrollment_id uuid REFERENCES student_enrollments(id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX only_one_active_academic_year_per_school ON academic_years(school_id) WHERE is_active;
CREATE INDEX idx_class_periods_year ON class_periods(school_id, academic_year_id);
CREATE INDEX idx_enrollments_student ON student_enrollments(school_id, student_id, academic_year_id);
CREATE INDEX idx_teacher_assignments_teacher ON teacher_class_assignments(school_id, teacher_user_id);

ALTER TABLE education_levels ENABLE ROW LEVEL SECURITY; ALTER TABLE education_levels FORCE ROW LEVEL SECURITY;
ALTER TABLE class_groups ENABLE ROW LEVEL SECURITY; ALTER TABLE class_groups FORCE ROW LEVEL SECURITY;
ALTER TABLE class_periods ENABLE ROW LEVEL SECURITY; ALTER TABLE class_periods FORCE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY; ALTER TABLE student_enrollments FORCE ROW LEVEL SECURITY;
ALTER TABLE teacher_class_assignments ENABLE ROW LEVEL SECURITY; ALTER TABLE teacher_class_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY education_level_isolation ON education_levels USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
CREATE POLICY class_group_isolation ON class_groups USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
CREATE POLICY class_period_isolation ON class_periods USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
CREATE POLICY enrollment_isolation ON student_enrollments USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
CREATE POLICY teacher_assignment_isolation ON teacher_class_assignments USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON education_levels,class_groups,class_periods,student_enrollments,teacher_class_assignments TO ramu_app;
