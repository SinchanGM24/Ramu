# RAMU

RAMU (_Raport Murid_) is a multi-tenant SaaS for TK/PAUD schools to prepare, review, publish, and securely distribute student reports.

## Struktur

- `frontend/` — Next.js App Router, Tailwind, komponen UI reusable, dan layout responsif.
- `backend/` — NestJS/Fastify REST API, PostgreSQL migration, RLS, RBAC, serta audit log.
- `docker-compose.yml` — PostgreSQL, Redis, MinIO, API, dan web untuk pengembangan lokal.

Ikuti [panduan lokal](docs/LOCAL_DEVELOPMENT.md) untuk menjalankan proyek.

Panduan produk, aturan implementasi internal, dan konfigurasi agent disimpan hanya pada workspace pengembangan. Materi tersebut tidak termasuk dalam repository publik maupun distribusi aplikasi.

## Lisensi

RAMU adalah perangkat lunak proprietary dan rahasia. Hak cipta dilindungi; kode sumber, dokumentasi, desain, dan materi terkait tidak boleh disalin, dimodifikasi, didistribusikan, disublisensikan, dipublikasikan, atau digunakan untuk membuat karya turunan tanpa izin tertulis dari pemegang hak cipta. Lihat [LICENSE](LICENSE) untuk ketentuan lengkap. Komponen pihak ketiga tetap tunduk pada lisensi masing-masing.
