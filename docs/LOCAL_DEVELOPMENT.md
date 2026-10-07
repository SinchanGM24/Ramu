# Menjalankan RAMU secara lokal

## Prasyarat

Node.js 24+, npm, dan Docker Desktop. Salin `backend/.env.example` menjadi `backend/.env`, serta `frontend/.env.example` menjadi `frontend/.env.local`. Ganti semua password contoh sebelum digunakan di lingkungan selain lokal.

## Menjalankan

```powershell
npm install
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

- Frontend: `http://localhost:3000`
- API health check: `http://localhost:4000/api/health`
- MinIO Console: `http://localhost:9001`

Setelah `npm run db:seed`, gunakan akun development berikut (hanya lokal): `admin@ramu.test` (Admin Sekolah), `guru@ramu.test` (Guru), dan `kepsek@ramu.test` (Kepala Sekolah). Semuanya memakai kata sandi `pass1234`, atau nilai `SEED_DEMO_PASSWORD` dari `backend/.env`.

## Keamanan lokal

PostgreSQL menerapkan RLS pada semua data milik tenant. API memakai role non-superuser `ramu_app`, sedangkan role `ramu` hanya untuk bootstrap/migration lokal; backend menetapkan `app.school_id` di dalam tiap transaksi tenant dan tetap menjalankan pemeriksaan peran di server. Jangan gunakan akun/password contoh atau MinIO lokal untuk deployment produksi.

Jika sebelumnya sudah menjalankan Compose sebelum role aplikasi ditambahkan, hapus volume lokal yang dapat dibuat ulang lalu jalankan kembali `docker compose up -d`: `docker compose down -v`. Perintah ini menghapus data development lokal.

Untuk memeriksa source code, jalankan `npm run build` dan `npm test`. Docker Compose juga dapat membangun frontend dan API dengan `docker compose up --build`.
