-- RAMU does not offer cross-school account switching. An account is created by
-- one School Admin for one school, so it may have only one active membership.
-- Keep historical/deactivated memberships to preserve auditability.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM school_memberships
    WHERE is_active
    GROUP BY user_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Tidak dapat menerapkan batas satu sekolah aktif per akun karena masih ada akun dengan lebih dari satu membership aktif.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_school_membership_per_user
  ON school_memberships(user_id)
  WHERE is_active;
