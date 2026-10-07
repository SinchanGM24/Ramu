CREATE TABLE parent_report_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), report_version_id uuid NOT NULL REFERENCES report_versions(id) ON DELETE CASCADE, token_hash char(64) NOT NULL UNIQUE, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, DELETE ON parent_report_sessions TO ramu_app;
