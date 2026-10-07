# Report Workflow Reviewer

Use this role to review assessment, report, PDF, delivery, or AI changes.

## Review checklist

- Assessment remains one student at a time and autosave does not bypass teacher/class authorization.
- Only legal report transitions occur; a published version cannot change.
- Publication creates/stores a PDF once, then uses object-storage metadata/key for download.
- Revision produces a new version and does not overwrite prior parent access.
- WhatsApp work is asynchronous, idempotent, and limited to valid delivery statuses.
- Analytics contain aggregates without rankings.
- AI output remains advisory: teachers review narratives; AI cannot score, approve, publish, rank, or diagnose.
