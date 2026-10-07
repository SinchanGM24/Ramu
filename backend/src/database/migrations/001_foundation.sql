CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE membership_role AS ENUM ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PRINCIPAL');
CREATE TYPE student_gender AS ENUM ('MALE', 'FEMALE');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  email varchar(320) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(160) NOT NULL, slug varchar(180) NOT NULL UNIQUE,
  address text, phone varchar(40), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE school_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE, role membership_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id, school_id)
);
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  plan varchar(40) NOT NULL DEFAULT 'TRIAL', status varchar(40) NOT NULL DEFAULT 'ACTIVE', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE, token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL, revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name varchar(20) NOT NULL, starts_on date NOT NULL, ends_on date NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (starts_on < ends_on), UNIQUE(school_id, name)
);
CREATE TABLE semesters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE, name varchar(50) NOT NULL,
  starts_on date NOT NULL, ends_on date NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), CHECK (starts_on < ends_on), UNIQUE(school_id, academic_year_id, name)
);
CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE, name varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(school_id, academic_year_id, name)
);
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL, name varchar(120) NOT NULL, student_number varchar(50),
  birth_date date, gender student_gender, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(school_id, student_number)
);
CREATE TABLE guardian_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE, name varchar(120) NOT NULL, relationship varchar(50) NOT NULL,
  phone varchar(30) NOT NULL, is_primary boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL, action varchar(120) NOT NULL, entity_type varchar(80) NOT NULL,
  entity_id uuid NOT NULL, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_memberships_school_user ON school_memberships(school_id, user_id);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_guardians_student ON guardian_contacts(student_id);
CREATE INDEX idx_audit_school_created ON audit_logs(school_id, created_at DESC);

-- The web/API role is deliberately non-superuser so it cannot bypass RLS.
GRANT USAGE ON SCHEMA public TO ramu_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ramu_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ramu_app;

-- The application sets app.school_id inside every tenant transaction. FORCE prevents table owners from bypassing policies.
ALTER TABLE schools ENABLE ROW LEVEL SECURITY; ALTER TABLE schools FORCE ROW LEVEL SECURITY;
ALTER TABLE school_memberships ENABLE ROW LEVEL SECURITY; ALTER TABLE school_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY; ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY; ALTER TABLE academic_years FORCE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY; ALTER TABLE semesters FORCE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY; ALTER TABLE classes FORCE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY; ALTER TABLE students FORCE ROW LEVEL SECURITY;
ALTER TABLE guardian_contacts ENABLE ROW LEVEL SECURITY; ALTER TABLE guardian_contacts FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY; ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY school_isolation ON schools USING (id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (id = NULLIF(current_setting('app.school_id', true), '')::uuid);
CREATE POLICY membership_isolation ON school_memberships USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid OR user_id = NULLIF(current_setting('app.user_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
CREATE POLICY subscription_isolation ON subscriptions USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
CREATE POLICY academic_year_isolation ON academic_years USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
CREATE POLICY semester_isolation ON semesters USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
CREATE POLICY class_isolation ON classes USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
CREATE POLICY student_isolation ON students USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
CREATE POLICY guardian_isolation ON guardian_contacts USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
CREATE POLICY audit_isolation ON audit_logs USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
