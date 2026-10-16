# Deployment PostgreSQL RAMU

## Pemisahan role

- `ramu_app` adalah satu-satunya role yang dipakai API melalui `DATABASE_URL`.
- Role API wajib `NOSUPERUSER`, `NOBYPASSRLS`, `NOCREATEDB`, `NOCREATEROLE`, dan `NOINHERIT`.
- `DATABASE_MIGRATION_URL` hanya dipakai job migrasi/CI dengan role pemilik skema atau role migrator yang terpisah. Jangan masukkan variabel ini ke container API runtime.
- `DATABASE_SEED_URL` hanya untuk environment development atau QA. Seed tidak boleh dijalankan pada production.

## Konfigurasi runtime

```text
DATABASE_URL=postgresql://ramu_app:<rahasia>@<host>:5432/ramu
DATABASE_MIGRATION_URL=postgresql://ramu_migrator:<rahasia>@<host>:5432/ramu
```

Saat `NODE_ENV=production`, API RAMU memeriksa role dari `DATABASE_URL` ketika startup. Startup dibatalkan bila role tersebut memiliki `SUPERUSER` atau `BYPASSRLS`.

## Pemeriksaan sebelum rilis

Jalankan menggunakan role migrator:

```sql
SELECT rolname, rolsuper, rolbypassrls
FROM pg_roles
WHERE rolname = 'ramu_app';

SELECT has_schema_privilege('ramu_app', 'public', 'CREATE') AS app_can_create;
```

Kedua kolom role harus `false`, dan `app_can_create` juga harus `false`.

Selanjutnya pastikan setiap transaksi tenant tetap menetapkan `app.school_id`, lalu uji akses dua sekolah yang berbeda untuk murid, kelas, raport, dan pengiriman. Role aplikasi tidak boleh dapat membaca atau memutasi baris tenant lain meskipun mengetahui UUID-nya.

## Urutan deployment

1. Jalankan migrasi dari job terpisah dengan `DATABASE_MIGRATION_URL`.
2. Verifikasi role, RLS, dan hak fungsi akses wali.
3. Jalankan API hanya dengan `DATABASE_URL` role `ramu_app`.
4. Jalankan smoke test dua tenant sebelum membuka akses pengguna.
