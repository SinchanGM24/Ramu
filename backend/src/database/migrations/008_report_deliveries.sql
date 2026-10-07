CREATE TYPE report_delivery_status AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

CREATE TABLE report_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  report_version_id uuid NOT NULL REFERENCES report_versions(id) ON DELETE CASCADE,
  guardian_contact_id uuid NOT NULL REFERENCES guardian_contacts(id) ON DELETE CASCADE,
  channel varchar(30) NOT NULL DEFAULT 'WHATSAPP' CHECK (channel = 'WHATSAPP'),
  recipient_phone varchar(30) NOT NULL,
  status report_delivery_status NOT NULL DEFAULT 'QUEUED',
  provider_message_id text,
  failure_reason text,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  queued_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(report_version_id, guardian_contact_id)
);

CREATE INDEX idx_report_deliveries_version_status ON report_deliveries(report_version_id, status, queued_at);
CREATE INDEX idx_report_deliveries_school_created ON report_deliveries(school_id, created_at DESC);

ALTER TABLE report_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_deliveries FORCE ROW LEVEL SECURITY;
CREATE POLICY report_deliveries_isolation ON report_deliveries
  USING (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid)
  WITH CHECK (school_id = NULLIF(current_setting('app.school_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE ON report_deliveries TO ramu_app;
