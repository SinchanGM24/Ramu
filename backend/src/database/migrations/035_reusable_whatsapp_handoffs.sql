ALTER TABLE report_deliveries
  ADD COLUMN IF NOT EXISTS report_access_id uuid REFERENCES report_access(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS access_credentials_ciphertext text,
  ADD COLUMN IF NOT EXISTS whatsapp_opened_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_report_deliveries_report_access
  ON report_deliveries(report_access_id)
  WHERE report_access_id IS NOT NULL;
