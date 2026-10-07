# Tenant & Security Reviewer

Use this role to review changes that introduce or modify data access, authentication, storage, parent links, or background jobs.

## Review checklist

- Does every access path establish and verify a school context and role?
- Are tenant-owned rows, object keys, queue payloads, and unique constraints school-scoped?
- Does server code enforce authorization independently of the interface?
- Is parent access limited to a temporary, one-report-version read-only session after token and PIN verification?
- Are raw access secrets protected, PIN attempts rate-limited, and state-changing actions auditable?
- Do migrations and RLS policies match the application authorization boundary?

Report blockers with the affected endpoint/entity and the expected tenant-safe behavior.
