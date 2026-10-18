CREATE TABLE indicator_narrative_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  indicator_id uuid NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
  semantic_group varchar(100) NOT NULL,
  competency_concept varchar(160) NOT NULL,
  narrative_label varchar(240) NOT NULL,
  observation_type varchar(30) NOT NULL CHECK (observation_type IN ('SKILL','SAFETY','MEASUREMENT')),
  recommendation_tags text[] NOT NULL DEFAULT '{}',
  metadata_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(indicator_id)
);

CREATE TABLE report_narrative_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  development_area_id uuid NOT NULL REFERENCES development_areas(id) ON DELETE CASCADE,
  generated_by uuid NOT NULL REFERENCES users(id),
  engine_version varchar(40) NOT NULL,
  generation_signature varchar(128) NOT NULL,
  content text NOT NULL,
  covered_indicator_ids uuid[] NOT NULL DEFAULT '{}',
  omitted_indicator_ids uuid[] NOT NULL DEFAULT '{}',
  validation_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_narrative_generation_report_area ON report_narrative_generations(school_id,report_id,development_area_id,created_at DESC);

ALTER TABLE indicator_narrative_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_narrative_metadata FORCE ROW LEVEL SECURITY;
ALTER TABLE report_narrative_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_narrative_generations FORCE ROW LEVEL SECURITY;
CREATE POLICY indicator_narrative_metadata_isolation ON indicator_narrative_metadata USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
CREATE POLICY report_narrative_generations_isolation ON report_narrative_generations USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid) WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON indicator_narrative_metadata, report_narrative_generations TO ramu_app;
