# Deploy beta RAMU di Vercel

Dokumen ini untuk beta gratis dengan satu sekolah pilot. Jangan gunakan data murid nyata pada deployment preview.

## Konfigurasi proyek

1. Impor repository sebagai monorepo dan pilih `frontend` sebagai Root Directory.
2. Aktifkan opsi Vercel untuk menyertakan source di luar Root Directory. API same-origin mengimpor adaptor dari `backend/`.
3. Pastikan semua dependency workspace tersedia saat build. Jangan menjalankan migrasi atau seed sebagai bagian dari Vercel Function.
4. Atur environment production: `DATABASE_URL`, `FRONTEND_ORIGIN`, object storage, `PARENT_ACCESS_CREDENTIAL_KEY`, `RATE_LIMIT_REDIS_URL`, dan `CRON_SECRET`. `DATABASE_MIGRATION_URL` hanya digunakan oleh job migrasi terpisah.

## Runtime

- Frontend dan API memakai satu origin. Browser memanggil `/api/*`.
- Route `frontend/src/app/api/[[...path]]/route.ts` meneruskan request ke Nest/Fastify tanpa memanggil `listen()`.
- Vercel Cron memanggil `GET /api/internal/retention/cleanup` setiap hari pukul 03.00 UTC. Vercel mengirim `Authorization: Bearer <CRON_SECRET>`.
- Setiap item publikasi mengirim satu pesan ke Vercel Queue dengan idempotency key stabil. Consumer `app/api/queues/report-publication/route.ts` dipicu privat oleh Queue. Konfigurasi trigger Queue saat ini tidak menyediakan batas konkurensi; penguncian job dan item di PostgreSQL menjaga satu pekerjaan tidak diproses ganda.

## Batas beta

- Gunakan Neon pooled connection untuk `DATABASE_URL`; runtime memakai role `ramu_app` yang tidak dapat melewati RLS.
- Gunakan object storage privat untuk PDF/foto. Function tidak boleh menyimpan file durabel di disk lokal.
- Gunakan Upstash Redis untuk rate limit produksi. Fallback memori hanya untuk development satu proses.
- Lakukan backup PostgreSQL manual setiap minggu dan uji restore sebelum menerima data produksi.

## Urutan rilis

1. Jalankan `npm run db:migrate -w backend` dari lingkungan migrasi yang memiliki `DATABASE_MIGRATION_URL`.
2. Buat Super Admin sekali dengan `npm run platform:bootstrap -w backend`.
3. Deploy ke preview tanpa data nyata, lalu lakukan smoke test login, akses wali, PDF tersimpan, dan isolasi dua tenant.
4. Baru promosikan ke production setelah Queue consumer publikasi telah diuji idempotensi dan retry-nya.
