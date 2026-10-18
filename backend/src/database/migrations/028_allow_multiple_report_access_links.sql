-- A published report can be shared with more than one guardian. Each manual
-- WhatsApp handoff receives its own permanent token and PIN for that report version.
ALTER TABLE report_access
  DROP CONSTRAINT IF EXISTS report_access_report_version_id_key;
