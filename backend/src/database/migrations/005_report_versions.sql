CREATE TABLE report_versions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE, report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE, version_number integer NOT NULL, snapshot jsonb NOT NULL, pdf_storage_key text, published_by uuid NOT NULL REFERENCES users(id), published_at timestamptz NOT NULL DEFAULT now(), UNIQUE(report_id,version_number));
ALTER TABLE report_versions ENABLE ROW LEVEL SECURITY; ALTER TABLE report_versions FORCE ROW LEVEL SECURITY;
CREATE POLICY report_versions_isolation ON report_versions USING (school_id = NULLIF(current_setting('app.school_id',true),'')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id',true),'')::uuid);
CREATE FUNCTION prevent_report_version_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Published report versions are immutable'; END; $$;
CREATE TRIGGER report_versions_immutable BEFORE UPDATE OR DELETE ON report_versions FOR EACH ROW EXECUTE FUNCTION prevent_report_version_mutation();
GRANT SELECT, INSERT ON report_versions TO ramu_app;
