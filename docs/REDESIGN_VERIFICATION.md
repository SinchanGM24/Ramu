# Laporan Verifikasi Redesign RAMU

Tanggal: 14 Oktober 2026

## Cakupan yang telah didesain

Seluruh rute frontend yang ditemukan telah ditinjau dan memperoleh sistem visual RAMU yang sama:

- Publik: `/`, `/login`, `/register`, dan `/r/[token]`.
- Workspace: dashboard, akademik, data/profil murid, perpindahan, kelulusan, arsip, serta penilaian individual.
- Rapor: progress, editor, portfolio, review, publikasi, pengiriman, preview, dan rapor terbit.
- Pengaturan: profil sekolah, kelola akun, dan profil akun.

Rute Next tetap tipis. Komponen halaman, dialog, tabel, filter, dan hooks berada di domain `features` atau komponen bersama sesuai tanggung jawabnya.

## Sistem desain dan komponen bersama

- Token utama: ivory hangat, paper, teks forest gelap, aksen interaktif forest, border lembut, radius, dan bayangan ringan.
- Shell aplikasi: sidebar desktop, topbar seluler, navigasi bawah, dan drawer menu seluler berbasis role.
- Komponen bersama: Button, Card, PageHeader, ModalDialog, ConfirmationDialog, StatusBadge, PaginationControls, Switch, LoadingState, dan EmptyState.
- Ilustrasi orisinal RAMU berada di `frontend/public/brand/`; dipakai hanya pada konteks yang membantu orientasi.
- Rapor formal, preview, PDF, dan parent viewer mempertahankan struktur dokumen dan print layout tanpa dekorasi yang mengganggu.

## Audit responsivitas dan akses

Audit statis dilakukan pada kelas responsif, navigasi, dan struktur shell:

- Konten utama menggunakan padding responsif dan batas lebar `max-w-7xl`.
- Sidebar hanya tampil desktop; seluler memakai topbar, bottom navigation, dan drawer.
- Drawer menu menampilkan seluruh rute yang diizinkan tiap role, termasuk akses Guru ke Siswa, Perpindahan & Kelulusan, Arsip, dan Profil Akun.
- Drawer dapat ditutup melalui tombol, backdrop, atau Escape; scroll latar dikunci ketika drawer terbuka.
- Bottom navigation menyesuaikan dua atau tiga item sehingga tidak menyisakan kolom kosong.
- Loading dan empty state utama telah memakai komponen bersama dengan status aksesibel.

Hak akses dan endpoint tidak diubah. Filter navigasi hanya menggunakan role yang telah diterima dari sesi aplikasi.

## Pemeriksaan teknis

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run format:check -w frontend` | Lulus |
| `npm run lint -w frontend` | Lulus |
| `npx tsc -p frontend/tsconfig.json --noEmit` | Lulus |
| `npm run build -w backend` | Lulus |
| `npm test` | Lulus: 14 berkas, 41 test |

Backend test yang lulus mencakup autentikasi, otorisasi lifecycle, student controller, workflow/otorisasi rapor, akses wali, pengiriman rapor, template PAUD, dan generator narasi.

## Keterbatasan verifikasi

- Tidak ada Playwright, Cypress, atau browser automation pada repository. Karena itu tidak ada klaim screenshot atau klik browser nyata untuk setiap breakpoint.
- `npm run build -w frontend` berhasil sampai kompilasi dan pemeriksaan tipe, tetapi proses tidak melanjutkan ekspor halaman dalam lingkungan eksekusi ini. Lint dan type-check terpisah lulus. Build perlu dikonfirmasi pada mesin pengembang melalui terminal lokal.
- Pengujian klik nyata dengan data uji untuk Admin Sekolah, Guru, Kepala Sekolah, dan wali tetap perlu dilakukan di browser lokal, terutama untuk dialog, upload portfolio, pengiriman wali, dan akses token/PIN.

## Langkah penutupan yang disarankan

1. Jalankan `npm run dev` pada mesin lokal dan buka rute menggunakan viewport desktop, tablet, serta ponsel.
2. Jalankan checklist role pada `plan.md` dengan akun data uji.
3. Setelah build frontend selesai penuh di mesin lokal dan alur nyata tervalidasi, tandai dua item “Perlu uji browser lokal” pada `plan.md` sebagai selesai.
