# RAMU

RAMU (*Raport Murid*) is a multi-tenant SaaS for TK/PAUD schools to prepare, review, publish, and securely distribute student reports.

## Struktur

- `frontend/` — Next.js App Router, Tailwind, komponen UI reusable, dan layout responsif.
- `backend/` — NestJS/Fastify REST API, PostgreSQL migration, RLS, RBAC, serta audit log.
- `docker-compose.yml` — PostgreSQL, Redis, MinIO, API, dan web untuk pengembangan lokal.

Ikuti [panduan lokal](docs/LOCAL_DEVELOPMENT.md) untuk menjalankan proyek.

Product and delivery guidance lives in [docs/PRD.md](docs/PRD.md). Repository-level implementation rules are in [AGENTS.md](AGENTS.md). Codex can use the local [`ramu-saas` skill](.codex/skills/ramu-saas/SKILL.md) for feature work.
