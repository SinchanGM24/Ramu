-- Preserve published source rows as historical references, but deactivate the legacy placeholder framework.
UPDATE assessment_frameworks
SET is_active = false
WHERE name = 'Kurikulum PAUD'
  AND id IN (
    SELECT framework_id FROM development_areas da
    JOIN sub_areas sa ON sa.development_area_id = da.id
    JOIN indicators i ON i.sub_area_id = sa.id
    GROUP BY framework_id
    HAVING count(*) = 6 AND bool_and(i.description LIKE 'Observasi %')
  );

UPDATE reports SET status = 'DRAFT', submitted_at = NULL, approved_at = NULL, updated_at = now()
WHERE status <> 'PUBLISHED'
  AND school_id IN (SELECT school_id FROM assessment_frameworks WHERE name = 'Kurikulum PAUD' AND is_active = false);

DELETE FROM report_approvals ra
USING reports r
WHERE ra.report_id = r.id AND r.status = 'DRAFT';

DELETE FROM report_narratives rn
USING reports r
WHERE rn.report_id = r.id AND r.status = 'DRAFT';

ALTER TABLE students ADD COLUMN IF NOT EXISTS nickname varchar(120);
ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_place varchar(120);
ALTER TABLE students ADD COLUMN IF NOT EXISTS religion varchar(80);
ALTER TABLE students ADD COLUMN IF NOT EXISTS child_order smallint CHECK (child_order > 0);
ALTER TABLE students ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE guardian_contacts ADD COLUMN IF NOT EXISTS occupation varchar(120);
