-- Pekerjaan wali adalah informasi tambahan dan boleh tidak diisi.
ALTER TABLE guardian_contacts
  ALTER COLUMN occupation DROP NOT NULL;
