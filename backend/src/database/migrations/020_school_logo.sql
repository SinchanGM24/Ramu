ALTER TABLE schools ADD COLUMN IF NOT EXISTS logo_storage_key text;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS logo_content_type varchar(100);
