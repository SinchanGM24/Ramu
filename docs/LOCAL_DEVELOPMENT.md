# Menjalankan RAMU secara lokal

## Prasyarat

Node.js 24+, npm, dan Docker Desktop. Salin `backend/.env.example` menjadi `backend/.env`, serta `frontend/.env.example` menjadi `frontend/.env.local`. Ganti semua password contoh sebelum digunakan di lingkungan selain lokal.

## Menjalankan

```powershell
npm install
docker compose up -d postgres redis minio
npm run db:migrate
npm run db:seed
npm run dev
```

`DATABASE_URL` digunakan API dengan role terbatas `ramu_app`. Biarkan `DATABASE_MIGRATION_URL` dan `DATABASE_SEED_URL` di `backend/.env` memakai role bootstrap lokal `ramu`; keduanya hanya dibaca oleh perintah migrasi dan seed, bukan oleh API saat berjalan.

- Frontend: `http://localhost:3001`
- API health check: `http://localhost:4001/api/health`
- MinIO Console: `http://localhost:9011`

Setelah `npm run db:seed`, gunakan akun development berikut (hanya lokal): `admin@ramu.test` (Admin Sekolah), `guru.aisyah@ramu.test`, `guru.budi@ramu.test`, `guru.citra@ramu.test` (Guru), dan `kepsek@ramu.test` (Kepala Sekolah). Semuanya memakai kata sandi `pass1234`, atau nilai `SEED_DEMO_PASSWORD` dari `backend/.env`.

## Keamanan lokal

PostgreSQL menerapkan RLS pada semua data milik tenant. API memakai role non-superuser `ramu_app`, sedangkan role `ramu` hanya untuk bootstrap/migration lokal; backend menetapkan `app.school_id` di dalam tiap transaksi tenant dan tetap menjalankan pemeriksaan peran di server. Jangan gunakan akun/password contoh atau MinIO lokal untuk deployment produksi.

Untuk mereset **hanya** PostgreSQL development dan memakai fixture akademik/staf terbaru, hentikan API dan PostgreSQL, hapus volume `ramu_postgres_data`, lalu jalankan kembali PostgreSQL/API, `npm run db:migrate`, dan `npm run db:seed`. Jangan jadikan seed bagian dari `npm run dev` atau startup API.

Untuk memeriksa source code, jalankan `npm run build` dan `npm test`.

Jika ingin menjalankan seluruh aplikasi dari container (bukan mode development di atas), gunakan `docker compose up -d --build`. Untuk pengembangan harian, jalankan hanya `docker compose up -d postgres redis minio`, lalu `npm run dev`; frontend dan API akan memakai port `3001` dan `4001`.
