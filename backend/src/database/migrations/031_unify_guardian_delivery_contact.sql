-- A contact selected to receive a raport is also the student's sole primary contact.
-- Preserve the most relevant existing active contact before enforcing the new invariant.
WITH ranked_contacts AS (
  SELECT
    id,
    student_id,
    is_active,
    row_number() OVER (
      PARTITION BY student_id
      ORDER BY
        (is_active AND (is_primary OR is_delivery_recipient)) DESC,
        is_primary DESC,
        created_at ASC,
        id ASC
    ) AS contact_position,
    bool_or(is_active AND (is_primary OR is_delivery_recipient)) OVER (
      PARTITION BY student_id
    ) AS has_delivery_contact
  FROM guardian_contacts
)
UPDATE guardian_contacts guardian
SET
  is_primary = ranked_contacts.has_delivery_contact
    AND ranked_contacts.contact_position = 1,
  is_delivery_recipient = ranked_contacts.has_delivery_contact
    AND ranked_contacts.contact_position = 1
FROM ranked_contacts
WHERE guardian.id = ranked_contacts.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_guardian_one_active_delivery_recipient
  ON guardian_contacts(student_id)
  WHERE is_active AND is_delivery_recipient;
