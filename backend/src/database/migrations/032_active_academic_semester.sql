-- Each school works in one explicitly selected semester at a time.
ALTER TABLE semesters
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

-- Recover existing schools safely by selecting the current calendar semester of
-- their active academic year, or the latest available semester when none spans today.
WITH ranked_semesters AS (
  SELECT
    semester.id,
    row_number() OVER (
      PARTITION BY semester.school_id
      ORDER BY
        CASE
          WHEN semester.starts_on <= CURRENT_DATE AND semester.ends_on >= CURRENT_DATE THEN 0
          ELSE 1
        END,
        semester.starts_on DESC
    ) AS position
  FROM semesters semester
  JOIN academic_years year
    ON year.id = semester.academic_year_id
    AND year.school_id = semester.school_id
  WHERE year.is_active
)
UPDATE semesters semester
SET is_active = true
FROM ranked_semesters ranked
WHERE semester.id = ranked.id
  AND ranked.position = 1
  AND NOT EXISTS (
    SELECT 1
    FROM semesters active_semester
    WHERE active_semester.school_id = semester.school_id
      AND active_semester.is_active
  );

CREATE UNIQUE INDEX IF NOT EXISTS one_active_semester_per_school
  ON semesters(school_id)
  WHERE is_active;
