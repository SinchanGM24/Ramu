---
name: ramu-saas
description: Implement or review RAMU, a multi-tenant TK/PAUD report SaaS, when work touches tenant isolation, assessment, reports, parent access, WhatsApp, analytics, or its optional AI assistance.
---

# RAMU SaaS delivery

Use this skill for product, architecture, or implementation work in this repository. Read `docs/PRD.md` before making a design decision that affects scope, access control, workflow states, or data ownership.

## Non-negotiable product rules

- `school` is the tenant. Resolve roles through `school_memberships`; never add `users.school_id`.
- Scope every tenant-owned read/write to authenticated tenant context. Add RLS policies for the same boundary.
- Teacher assessment is individual per student; do not add a bulk-assessment interface or API.
- Parent access is token + PIN to a temporary, report-version-scoped read-only session. It allows only view, stored-PDF download, and print.
- Publishing makes a version immutable. A correction is a new version, PDF, token, and delivery scope.
- Analytics aggregate scale results only and never rank students.
- AI drafts/flags only. A human teacher or authorized staff member keeps all academic and publication decisions.

## Language boundary

Use English for code, database/API contracts, and internal state values. All user-facing UI and generated customer content must be Bahasa Indonesia. Translate status codes at the presentation boundary; never display raw codes such as `not-started`, `partial`, `complete`, `DRAFT`, or `PUBLISHED`.

## Delivery routing

- For a data model, route, authorization change, or API, read [tenancy and security](references/tenancy-security.md).
- For report workflow, parent view, PDF, or delivery work, read [report lifecycle](references/report-lifecycle.md).
- Before creating or modifying any report UI, template, report data model, preview, PDF, narrative, completion logic, or parent report view, read `REPORT_SPEC.md` at the repository root. Its report structure, Indonesian presentation rules, template boundaries, and no-bulk-assessment requirements are mandatory.
- For assessment and optional AI work, follow the requirements in `docs/PRD.md` sections 6 and 12.

## Completion standard

Implement only MVP-scope behavior. Verify affected permissions, status transitions, and tenant isolation. Record state-changing actions in the audit trail. Keep generated files in object storage, retaining metadata/storage keys in the database.
