# RAMU engineering instructions

## Product invariants

- A tenant is exactly one `school`. Never store a hard-coded `users.school_id`; use `school_memberships` (`user_id`, `school_id`, `role`).
- Every tenant-owned query and mutation must be scoped to the authenticated school context. PostgreSQL RLS is defense in depth, not a replacement for application authorization.
- Assessment is individual per student. Do not introduce bulk assessment workflows.
- A parent is not an application user: access is only through `/r/[token]` plus a PIN and grants view, PDF download, and print only.
- Published reports are immutable. Corrections create a new report version; never mutate a published version.
- Do not implement student ranking. Analytics are aggregated and internal to the school.
- AI may draft narratives or flag completeness/consistency only. It must never score, approve, publish, rank, or diagnose children.
- Every school receives the same default PAUD assessment framework and `BB`/`MB`/`BSH`/`BSB` scale automatically. Do not add manual framework creation or assessment-configuration screens in the MVP.

## Language convention

- Database schemas, API contracts, source-code identifiers, internal status values, and audit events may use English; for example: `not-started`, `partial`, `complete`, `DRAFT`, and `PUBLISHED`.
- Every user-facing string must be Bahasa Indonesia, including page headings, navigation, buttons, labels, empty states, validation/errors, notifications, email/WhatsApp copy, and PDF/parent-report content.
- Map internal assessment-progress values consistently in the UI: `not-started` → `Belum dimulai`, `partial` → `Sebagian terisi`, and `complete` → `Lengkap`. Never render raw internal status codes to users.

## Architecture boundaries

- Follow the monorepo boundaries in `apps/web`, `apps/worker`, and `packages/*` from the PRD.
- Put durable files in object storage; persist storage keys and metadata only, never PDF/photo blobs in PostgreSQL.
- Generate a PDF on publication, store it once, and serve the stored file thereafter.
- Queue WhatsApp work in a background worker. Delivery states are `QUEUED`, `SENT`, `DELIVERED`, `READ`, and `FAILED`.

## Frontend composition and file structure

- Treat `frontend/src/app/**/page.tsx` as a thin Next.js route entry point. It may resolve route parameters and render one feature-page component; it must not contain page UI, modal, table, form, query, or mutation implementations.
- Organize each substantial screen by domain under `frontend/src/features/<domain>/`. A page component is an orchestrator: it composes named UI components and connects only the state, callbacks, notifications, and data needed across those components.
- Put distinct, meaningful UI responsibilities in their own files under `components/`: headers, filters, tables/lists, forms, dialogs, action panels, summaries, and history sections. Name files after their responsibility, for example `student-create-dialog.tsx`, `class-table.tsx`, or `delivery-history-list.tsx`.
- Put reusable server-state or complex shared page-state in `hooks/`, domain contracts in `types.ts`, and pure domain helpers/status-label mappings in `utils.ts`. Keep local input state close to the form or dialog that owns it.
- Do not hide several large components inside a `*-page.tsx` file, and do not recreate a one-file implementation under a new folder. Conversely, do not split trivial labels, one-off text fragments, or a single simple markup element into files without a clear reuse or maintenance benefit.
- Reuse shared primitives from `components/shared` and `components/ui` for common behavior such as dialogs, page headers, pagination, status badges, buttons, and cards. Preserve feature-specific styling through explicit props or feature components rather than duplicating dialog shells.
- For any operational data list, use `frontend/src/features/students/list/components/student-directory-table.tsx` as the reference pattern. At `md` and above, render a semantic `table` with `table-fixed`, explicit `colgroup` widths, consistent header/row padding, hover state, and desktop loading, empty, and error rows. Below `md`, replace it with stacked information cards; do not make mobile users horizontally scroll a desktop table. Keep filters above the data, actions in the final column or card footer, and pagination beneath the data. Use the shared `PaginationControls`: it must show previous/next controls, a non-interactive current-page indicator, and up to four nearby page buttons excluding the active page (two before/two after, filling the available side at either boundary), rather than only a range/count sentence. Do not introduce grid-based pseudo-tables when this pattern applies.
- Keep imports, function calls, JSX props, conditional branches, and nested UI multiline and formatted with the repository Prettier configuration. Run `npm run format -w frontend` after frontend changes and verify with `npm run format:check -w frontend`.
- When moving files, update every route import before deleting the old module. Do not leave compatibility copies, duplicate feature implementations, or unused local component definitions.

## Implementation and verification

- Prefer TypeScript, strict tenant-aware types, and server-side authorization checks.
- Include authorization and tenant-isolation coverage for any new protected resource.
- Preserve existing user changes. Do not add MVP-excluded modules: LMS, billing/accounting, payroll, chat, daily attendance, native apps, parent accounts, or rankings.
- Consult `docs/PRD.md` for requirements and `.codex/agents/` for role-specific delivery checklists.
- Before implementing or changing any report editor, report view, PDF, parent viewer, report template, assessment completeness, or narrative behavior, read and comply with `REPORT_SPEC.md`. It is the authoritative report-module specification.
