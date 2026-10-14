# Checklist redesign UI/UX RAMU

Dokumen ini mencatat pekerjaan frontend-only. Redesign tidak mengubah API, database, RBAC, alur akademik, maupun workflow rapor.

Status:

- `Selesai`: implementasi visual dan komposisi halaman sudah diperbarui.
- `Perlu verifikasi`: implementasi selesai, tetapi masih menunggu pengecekan visual lintas ukuran layar dan alur per peran.
- `Belum dimulai`: belum ada pekerjaan khusus pada area tersebut.

## Fondasi bersama

- [x] Selesai — Token warna, permukaan ivory, aksen forest, shadow, radius, dan spacing global.
- [x] Selesai — Button, Card, Page Header, status, pagination, dialog, dan switch yang dipakai ulang.
- [x] Selesai — Shell aplikasi: sidebar, topbar, navigasi seluler, state aktif, dan navigasi berbasis peran.
- [x] Selesai — Aset ilustrasi orisinal RAMU untuk landing dan autentikasi.
- [ ] Perlu verifikasi — Konsistensi state loading, kosong, error, sukses, tooltip, dan dialog pada seluruh rute.

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

## Verifikasi akhir yang tersisa

- [ ] Belum dimulai — Audit visual desktop, tablet, dan ponsel pada seluruh rute.
- [ ] Belum dimulai — Uji alur Admin Sekolah: akademik, murid, lifecycle, publikasi, dan pengiriman.
- [ ] Belum dimulai — Uji alur Guru: kelas penugasan, pengisian individu, narasi, dan pengajuan.
- [ ] Belum dimulai — Uji alur Kepala Sekolah: tinjauan dan persetujuan rapor serta pengajuan lifecycle.
- [ ] Belum dimulai — Uji akses wali melalui token dan PIN pada ponsel.
- [ ] Perlu verifikasi — Build, pemeriksaan tipe, lint, format, dan tes tersedia.
- [ ] Belum dimulai — Laporan redesign akhir, hasil pemeriksaan, serta keterbatasan yang tersisa.

## Catatan pemeriksaan terakhir

- `npm run format:check -w frontend` lulus pada batch Portfolio Rapor.
- `npm run build -w frontend` telah melewati kompilasi dan pemeriksaan tipe pada batch Portfolio Rapor; masih ada satu peringatan lama pada `narrative-editor.tsx` mengenai dependency `useEffect`.
- Folder lokal `design/` berisi referensi desain pengguna dan sengaja tidak termasuk commit aplikasi.
