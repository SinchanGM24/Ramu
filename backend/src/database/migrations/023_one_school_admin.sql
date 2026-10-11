CREATE UNIQUE INDEX IF NOT EXISTS idx_one_school_admin_per_school
ON school_memberships(school_id)
WHERE role = 'SCHOOL_ADMIN';
