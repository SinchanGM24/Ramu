ALTER TABLE guardian_contacts ADD COLUMN IF NOT EXISTS delivery_label varchar(80);
ALTER TABLE guardian_contacts ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE guardian_contacts ADD COLUMN IF NOT EXISTS is_delivery_recipient boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_guardian_delivery_recipients ON guardian_contacts(school_id, student_id) WHERE is_active AND is_delivery_recipient;

-- Delivery history must survive a future contact-management change.
ALTER TABLE report_deliveries DROP CONSTRAINT IF EXISTS report_deliveries_guardian_contact_id_fkey;
ALTER TABLE report_deliveries ADD CONSTRAINT report_deliveries_guardian_contact_id_fkey FOREIGN KEY (guardian_contact_id) REFERENCES guardian_contacts(id) ON DELETE RESTRICT;
