# Tenancy and security decisions

## Tenant resolution

An authenticated application request selects a membership for `user_id` and `school_id`; its role controls authorization. Reject a missing, stale, or unauthorized tenant context before accessing tenant-owned resources. A resource identifier alone is never proof of tenant ownership.

All tenant-owned rows must carry `school_id` or be safely joined through a parent carrying `school_id`. Queries, mutations, unique constraints, and RLS policies must retain that boundary. Enforce the same relationship for uploads and queued jobs.

## Parent access

`report_access` belongs to one published report version. Store a cryptographic token verifier rather than a raw secret where possible, protect PIN verification with rate limits, and issue a short-lived session only after both checks succeed. Do not expose tenant navigation, other reports, or staff APIs through that session.

## Authorization checks

Do server-side role checks for each action. UI hiding is not authorization. Require assignment to the class/student for teacher writes. Require relevant staff authority for review, approval, publishing, user management, and delivery. Log access-sensitive and report-state actions.
