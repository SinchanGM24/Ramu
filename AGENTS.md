# RAMU engineering instructions

## Product invariants

- A tenant is exactly one `school`. Never store a hard-coded `users.school_id`; use `school_memberships` (`user_id`, `school_id`, `role`).
- Every tenant-owned query and mutation must be scoped to the authenticated school context. PostgreSQL RLS is defense in depth, not a replacement for application authorization.
- Assessment is individual per student. Do not introduce bulk assessment workflows.
- A parent is not an application user: access is only through `/r/[token]` plus a PIN and grants view, PDF download, and print only.
- Published reports are immutable. Corrections create a new report version; never mutate a published version.
- Do not implement student ranking. Analytics are aggregated and internal to the school.
- AI may draft narratives or flag completeness/consistency only. It must never score, approve, publish, rank, or diagnose children.

## Language convention

- Database schemas, API contracts, source-code identifiers, internal status values, and audit events may use English; for example: `not-started`, `partial`, `complete`, `DRAFT`, and `PUBLISHED`.
- Every user-facing string must be Bahasa Indonesia, including page headings, navigation, buttons, labels, empty states, validation/errors, notifications, email/WhatsApp copy, and PDF/parent-report content.
- Map internal assessment-progress values consistently in the UI: `not-started` → `Belum dimulai`, `partial` → `Sebagian terisi`, and `complete` → `Lengkap`. Never render raw internal status codes to users.

## Architecture boundaries

- Follow the monorepo boundaries in `apps/web`, `apps/worker`, and `packages/*` from the PRD.
- Put durable files in object storage; persist storage keys and metadata only, never PDF/photo blobs in PostgreSQL.
- Generate a PDF on publication, store it once, and serve the stored file thereafter.
- Queue WhatsApp work in a background worker. Delivery states are `QUEUED`, `SENT`, `DELIVERED`, `READ`, and `FAILED`.

## Implementation and verification

- Prefer TypeScript, strict tenant-aware types, and server-side authorization checks.
- Include authorization and tenant-isolation coverage for any new protected resource.
- Preserve existing user changes. Do not add MVP-excluded modules: LMS, billing/accounting, payroll, chat, daily attendance, native apps, parent accounts, or rankings.
- Consult `docs/PRD.md` for requirements and `.codex/agents/` for role-specific delivery checklists.
- Before implementing or changing any report editor, report view, PDF, parent viewer, report template, assessment completeness, or narrative behavior, read and comply with `REPORT_SPEC.md`. It is the authoritative report-module specification.
