# Report lifecycle

Valid primary sequence: `DRAFT → SUBMITTED → IN_REVIEW → APPROVED → PUBLISHED`.

Revision is allowed only as `IN_REVIEW → REVISION_REQUIRED → DRAFT`. Reject all other transitions unless the product requirements are deliberately updated with a migration and authorization review.

Publishing is a transactional boundary: create immutable version data, render and store one PDF, create report access with a six-digit PIN, create delivery records, then queue delivery. Make jobs idempotent: retries may update the same delivery attempt/state but must not create duplicate parent grants or mutate a published version.

The parent viewer retrieves the stored PDF. Never rerender a PDF during a parent request. A revision after publication creates a separate version and access scope.
