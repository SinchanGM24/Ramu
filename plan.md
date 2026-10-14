# Checklist redesign UI/UX RAMU

Dokumen ini mencatat pekerjaan frontend-only. Redesign tidak mengubah API, database, RBAC, alur akademik, maupun workflow rapor.

Status:

- `Selesai`: implementasi dan pemeriksaan statis sudah selesai.
- `Perlu uji browser lokal`: kode telah diperiksa, tetapi masih membutuhkan interaksi nyata pada browser.

## Fondasi bersama

- [x] Selesai — Token warna, permukaan ivory, aksen forest, shadow, radius, dan spacing global.
- [x] Selesai — Button, Card, Page Header, status, pagination, dialog, dan switch yang dipakai ulang.
- [x] Selesai — Loading dan empty state bersama untuk halaman data utama.
- [x] Selesai — Shell aplikasi: sidebar, topbar, navigasi seluler, state aktif, dan navigasi berbasis peran.
- [x] Selesai — Drawer menu seluler; Escape, backdrop, dan scroll-lock ditangani.
- [x] Selesai — Aset ilustrasi orisinal RAMU untuk landing dan autentikasi.

## Rute publik dan autentikasi

- [x] Selesai — `/`
- [x] Selesai — `/login`
- [x] Selesai — `/register`
- [x] Selesai — `/r/[token]`

## Rute aplikasi dan administrasi akademik

- [x] Selesai — `/app/dashboard`
- [x] Selesai — `/app/academic`
- [x] Selesai — `/app/academic/students`
- [x] Selesai — `/app/academic/students/[id]`
- [x] Selesai — `/app/academic/lifecycle`
- [x] Selesai — `/app/academic/archive`
- [x] Selesai — `/app/students/[id]/assessment`

## Rute rapor

- [x] Selesai — `/app/reports/progress`
- [x] Selesai — `/app/reports/review`
- [x] Selesai — `/app/reports/publication`
- [x] Selesai — `/app/reports/[id]`
- [x] Selesai — `/app/reports/[id]/portfolio`
- [x] Selesai — `/app/reports/[id]/preview`
- [x] Selesai — `/app/reports/[id]/published`
- [x] Selesai — `/app/reports/[id]/deliveries`

Catatan: preview, rapor terbit, PDF, dan viewer wali mempertahankan struktur formal serta aturan rapor terbit yang tidak dapat diubah.

## Rute pengaturan dan akun

- [x] Selesai — `/app/settings/school`
- [x] Selesai — `/app/settings/staff`
- [x] Selesai — `/app/settings/profile`

## Verifikasi akhir

- [x] Selesai — Audit statis rute, responsivitas kelas Tailwind, dan navigasi berbasis peran.
- [x] Selesai — Smoke test runtime untuk 22 entry route frontend melalui server lokal; seluruhnya HTTP 200.
- [x] Selesai — Format, lint, type-check frontend, build backend, dan 41 test backend.
- [x] Selesai — Laporan hasil serta keterbatasan pada `docs/REDESIGN_VERIFICATION.md`.
- [ ] Perlu uji browser lokal — Audit visual nyata desktop, tablet, dan ponsel untuk setiap rute.
- [ ] Perlu uji browser lokal — Alur nyata Admin Sekolah, Guru, Kepala Sekolah, dan wali memakai data uji.

## Catatan pemeriksaan terakhir

- `npm run format:check -w frontend`, `npm run lint -w frontend`, dan `npx tsc -p frontend/tsconfig.json --noEmit` lulus.
- `npm run build -w backend` serta `npm test` lulus; 14 berkas test dan 41 test backend berhasil.
- `npm run build -w frontend` berhasil melewati kompilasi serta pemeriksaan tipe, tetapi proses tidak melanjutkan ekspor halaman dalam lingkungan eksekusi ini. Catatan lengkap ada pada laporan verifikasi.
- Folder lokal `design/` berisi referensi desain pengguna dan sengaja tidak termasuk commit aplikasi.
