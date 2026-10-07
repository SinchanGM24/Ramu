# Product Requirements Document — RAMU

## 1. Purpose

RAMU (*Raport Murid*) is a multi-tenant SaaS for TK/PAUD schools. It enables a school to configure academic data, let teachers assess individual students, route reports through review and approval, publish an immutable PDF report, and share it to guardians through a secure WhatsApp link and PIN.

**Product outcome:** fewer manual report-production steps while preserving teacher and school control over every academic decision.

## 2. Users and access

| Role | Main capabilities |
| --- | --- |
| `SUPER_ADMIN` | Operates the shared SaaS and tenants. |
| `SCHOOL_ADMIN` | Configures the school, academic data, users, report publishing, and delivery. |
| `TEACHER` | Assesses students in assigned classes, writes narratives, and submits reports. |
| `PRINCIPAL` | Reviews, approves, or requests revisions. |
| `PARENT_VIEWER` | Not an app account. Uses a secure link plus PIN to view, download, or print one published report. |

Tenant equals `school`. Application users obtain roles through `school_memberships(user_id, school_id, role)`; do not use `users.school_id`.

## 3. MVP scope

### In scope

- Public landing, features, pricing, FAQ, login, and school registration.
- Account, school, plan, tenant creation, and onboarding.
- School profile, academic years, semesters, classes, teachers, students, and guardian contacts.
- Tenant-configurable assessment framework and scale.
- Individual student assessment, narratives, growth, attendance summary, extracurricular records, and portfolio.
- Review, approval, preview, versioned publication, PDF storage, secure parent access, WhatsApp distribution, aggregate analytics, and audit log.

### Explicitly out of scope

LMS, SPP/accounting, payroll, chat, daily attendance, student rankings, parent account systems, and native mobile apps.

## 4. Primary journeys

### School setup

`Landing → Register school → Admin account → School profile → Plan → Create tenant → Onboarding → Dashboard`

### Report creation and delivery

`Academic setup → Teacher individual assessment → Submit → Review → Approve → Publish → Generate PDF + secure token + six-digit PIN → Queue WhatsApp → Parent read-only view`

### Parent access

`/r/[token] → PIN verification → temporary session → view report / download stored PDF / print`

The parent must not edit, comment, upload, chat, access analytics, or see other students.

## 5. Information architecture

### Public

`/`, `/features`, `/pricing`, `/faq`, `/login`, `/register`

### School application

`/app/dashboard`

`/app/academic/{years,classes,teachers,students}`

`/app/reports/{progress,review,publish}`

`/app/analytics`, `/app/communication/whatsapp`

`/app/settings/{school,assessment,template,users,subscription}`

### Teacher workspace

`/app/dashboard`, `/app/my-class`, `/app/students/[id]`, `/app/students/[id]/assessment`, `/app/students/[id]/report`, `/app/class-analytics`

## 6. Assessment and teacher workspace

Framework hierarchy: `DevelopmentArea → SubArea → Indicator → Assessment`.

Default scale is `BB`, `MB`, `BSH`, `BSB`, but each tenant can configure its own scale/options. Initial development areas are Nilai Agama dan Moral, Fisik Motorik, Kognitif, Bahasa, Sosial Emosional, and Seni.

The student workspace shows identity, semester, completion progress, each development area, semester data, and report preview. Area state is visually `complete`, `partial`, or `not-started`. For each indicator the teacher chooses one scale option in one click; the result autosaves. Assessment is strictly one student at a time.

Semester data contains growth (weight, height, optional head circumference), attendance (sick, permission, absent), extracurricular activity/grade, and portfolio photo/caption/report inclusion.

## 7. Report lifecycle

`DRAFT → SUBMITTED → IN_REVIEW → APPROVED → PUBLISHED`

Revision path: `IN_REVIEW → REVISION_REQUIRED → DRAFT`.

On publication, persist an immutable report version, render report data through the HTML template, generate the PDF once, and place it in object storage. A later correction creates a new version. Parent downloads always return the existing stored PDF.

## 8. Analytics and communication

Analytics are internal only, at school, class, development area, sub-area, and indicator levels. Display aggregate count and percentage for every configured scale option; never show rankings.

Publication creates a PDF, secure access token, six-digit PIN, and delivery record. The worker processes WhatsApp delivery asynchronously. Admins can send all, send selected, and retry failed records. Valid statuses: `QUEUED`, `SENT`, `DELIVERED`, `READ`, `FAILED`.

## 9. Security and data requirements

- Use HTTP-only session cookies, RBAC, tenant context on every authenticated request, and PostgreSQL RLS.
- Every tenant-owned table has `school_id`, or an equally safe relation resolving to its school.
- Store PDFs/photos in S3-compatible object storage using signed URLs; database rows contain metadata and storage keys.
- Record auditable actions affecting assessment, review, approval, publication, access, and delivery.
- Parent tokens must be high entropy, PIN-protected, scoped to one report version, and create only a short-lived session after verification.

## 10. Core data model

| Domain | Entities |
| --- | --- |
| Identity and tenancy | `users`, `schools`, `school_memberships`, `subscriptions` |
| Academic | `academic_years`, `semesters`, `classes`, `students`, `guardian_contacts` |
| Assessment configuration | `assessment_frameworks`, `development_areas`, `sub_areas`, `indicators`, `assessment_scales`, `assessment_scale_options` |
| Assessment evidence | `student_assessments`, `report_narratives`, `growth_records`, `attendance_summaries`, `extracurricular_records`, `portfolio_items` |
| Reports and access | `reports`, `report_versions`, `report_approvals`, `report_access`, `report_deliveries` |
| Governance | `audit_logs` |

## 11. Technical direction

Use Next.js, React, TypeScript, PostgreSQL, Redis, S3-compatible storage, and Tailwind CSS. The intended monorepo is:

```text
apps/{web,worker}
packages/{database,auth,tenant,assessment,reports,messaging,analytics,ai,ui,config}
```

Implementation order: multi-tenant foundation; auth/RBAC; onboarding; master academic data; assessment engine; teacher workspace; report workflow; PDF; secure parent viewer; WhatsApp; analytics; optional AI assistant.

## 12. Optional AI assistance

| Agent | Permitted output |
| --- | --- |
| Narrative | Draft narrative from indicators, teacher notes, and development area; teacher must review/edit. |
| Completeness | Missing assessments, narratives, or semester data. |
| Consistency | Potential mismatch between assessments and narrative. |

AI cannot assign scores, approve/publish a report, rank students, or diagnose children.

## 13. Experience principles

Professional, friendly, educational, clean, and not childish. Use soft educational colors, rounded cards, ample whitespace, clear typography, and a sidebar/workspace layout for staff. Parent experience is mobile-first. UX priority: teacher workspace, assessment input, report preview, admin dashboard, parent viewer, then onboarding.

### Language convention

Internal identifiers, database/API values, and workflow status codes use English. All content presented to users—UI, validation, notifications, PDFs, and communication templates—uses Bahasa Indonesia. Assessment progress is displayed as **Belum dimulai**, **Sebagian terisi**, and **Lengkap**, while its internal values remain `not-started`, `partial`, and `complete`.
