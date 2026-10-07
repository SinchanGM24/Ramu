# RAMU — Spesifikasi Modul Rapor TK/PAUD

Dokumen ini adalah sumber kebenaran untuk semua halaman, API, preview, dan PDF rapor RAMU. Jika bertentangan dengan implementasi sementara, dokumen ini yang diikuti.

## 1. Representasi dan batas domain

Modul memiliki dua representasi:

1. **Report Editor** untuk guru/admin mengisi satu rapor siswa pada satu waktu.
2. **Report View** untuk preview, PDF, dan parent viewer read-only.

Editor boleh modern; preview/PDF mempertahankan struktur laporan, urutan area/subarea/indikator, skala, narasi, dan data akhir semester. Jangan memodelkan domain berdasarkan nomor halaman fisik (`page_12`, dll.). Nomor halaman hanya hasil layout.

Hierarki domain adalah `School → ReportTemplate → ReportLevel → DevelopmentArea → SubArea → Indicator → Assessment`. Template milik tenant dan harus dapat dikonfigurasi. Level minimal `KELOMPOK_A` dan `KELOMPOK_B`; indikator antar level tidak boleh diasumsikan sama atau disalin sebagai fakta kurikulum tanpa verifikasi.

Penilaian selalu terikat pada `student`, `academic_year`, `semester`, `report_level`, `indicator`, dan `assessment_value`.

## 2. Semester dan penilaian

Satu tahun pelajaran memiliki `SEMESTER_I` dan `SEMESTER_II`. Meskipun preview fisik memperlihatkan keduanya berdampingan, nilainya adalah record terpisah:

```text
student_assessment(student_id, semester_id, indicator_id, assessment_scale_option_id)
```

Jangan menambahkan kolom seperti `semester1_score`. Skala default: `BB` (Belum Berkembang), `MB` (Mulai Berkembang), `BSH` (Berkembang Sesuai Harapan), dan `BSB` (Berkembang Sangat Baik).

Assessment utama menggunakan tombol `[BB] [MB] [BSH] [BSB]`, single-select, satu klik, autosave, dan feedback visual. Jangan gunakan dropdown. Published report tidak dapat diedit. Input tidak pernah berbentuk satu indikator untuk seluruh siswa.

## 3. Identitas dan header

Bagian **Keterangan Anak Didik** menampilkan read-only data master siswa/wali: nama dan panggilan, nomor induk, jenis kelamin, tempat/tanggal lahir, agama, anak ke, nama/pekerjaan orang tua, serta alamat/telepon/desa/kecamatan/kabupaten/provinsi. Editor menyediakan aksi **Edit Profil Siswa**, bukan duplikasi form identitas.

Header laporan: **Laporan Perkembangan Anak Didik**, nama, nomor induk, kelompok/usia, tahun pelajaran, dan tabel indikator. Tampilan pengguna wajib Bahasa Indonesia.

## 4. Struktur template referensi

Seed template `DEFAULT_TK_REPORT_TEMPLATE` untuk level referensi yang telah diverifikasi. Ia memuat area dan subarea berikut, dalam urutan ini:

1. **Nilai-Nilai Agama dan Moral** — agama, gerakan ibadah, doa, perilaku baik/buruk, pembiasaan baik, salam.
2. **Fisik Motorik** — Motorik Kasar; Motorik Halus; Kesehatan dan Perilaku Keselamatan (pertumbuhan, toilet, alarm bahaya, rambu lalu lintas).
3. **Kognitif** — Belajar dan Pemecahan Masalah; Berpikir Logis; Berpikir Simbolik.
4. **Bahasa** — Memahami Bahasa; Mengungkapkan Bahasa; Keaksaraan.
5. **SOSEM** — Kesadaran Diri; Tanggungjawab Diri dan Orang Lain; Perilaku Prososial. Editor dapat memakai label **Sosial Emosional**, tetapi template PDF referensi memakai **SOSEM**.
6. **Seni** — menikmati lagu/suara; tertarik kegiatan seni.

Indikator harus disimpan sebagai data template yang dapat diedit per level, bukan hard-code halaman. Konten indikator mengikuti spesifikasi referensi yang diberikan: Fisik Motorik memiliki indikator motorik kasar, halus, dan keselamatan; Kognitif mencakup pemecahan masalah/logis/simbolik; Bahasa mencakup memahami/mengungkapkan/keaksaraan; SOSEM mencakup kesadaran diri, tanggung jawab, prososial; Seni mencakup musik serta ekspresi/karya seni.

Setiap **development area** memiliki tepat satu narasi per siswa per semester—bukan narasi per indikator atau subarea. Narasi memakai autosave.

## 5. Data akhir semester

Satu section **Data Akhir Semester** memuat:

- Ekstrakurikuler: `activity_name`, `semester`, `grade`; grade default A–D; kegiatan tidak dibatasi empat baris.
- Pertumbuhan: `weight_kg` dan `height_cm` numerik, bukan string berunit.
- Kehadiran: `sick_days`, `permission_days`, `unexcused_days`, semuanya minimum 0. Tidak ada daily attendance pada MVP.
- Pengesahan: tempat/tanggal, nama kepala PAUD/guru kelas, opsional gambar tanda tangan dan stempel.

Parent comment tidak dibuat. `parent_comment_mode` untuk template adalah `EMPTY_PRINT_AREA` atau `HIDDEN`; default template referensi `EMPTY_PRINT_AREA` agar PDF punya ruang tulis saat dicetak.

## 6. Editor dan progress

Guru mengerjakan **satu siswa**. Workspace menampilkan siswa, kelompok, semester, tahun ajaran, progress total, identitas, enam area, Data Akhir Semester, dan Preview. Gunakan accordion subarea; tiap subarea menunjukkan jumlah selesai.

Status internal `NOT_STARTED`, `IN_PROGRESS`, `COMPLETE` dipetakan pada UI menjadi **Belum dimulai**, **Sedang diisi**, **Lengkap**. Progress dihitung dari indikator wajib, narasi wajib, dan data semester wajib. Sebelum submit, tampilkan daftar data kurang per area/data akhir; tombol **Submit untuk Review** disabled sampai lengkap.

Autosave assessment/narasi menampilkan **Tersimpan**. Jika gagal, tampilkan **Perubahan belum tersimpan** dan aksi **Coba Lagi**. Tidak boleh ada satu tombol Save di akhir seluruh rapor.

## 7. Workflow, preview, dan akses parent

Workflow: `DRAFT → SUBMITTED → IN_REVIEW → APPROVED → PUBLISHED`; revisi: `IN_REVIEW → REVISION_REQUIRED → DRAFT`. Published report immutable; koreksi menciptakan versi baru.

Preview mengikuti struktur output, bukan tampilan editor: identitas, tabel assessment, narasi, data semester, dan pengesahan. PDF renderer memakai data semantik template/level/area/subarea/indikator/semester. Guru dapat preview, print preview, dan download draft.

Parent mengakses `/r/[secureToken]` lalu PIN dan temporary session. Parent hanya dapat melihat, download PDF, dan print final published report; tidak dapat edit, komentar, upload, chat, melihat analytics, atau melihat siswa lain.

## 8. Kriteria implementasi wajib

- Tenant = school; semua template, indikator, assessment, narasi, dan data semester tenant-scoped/RLS.
- Parent strictly read-only dan bukan akun aplikasi.
- Analytics internal boleh agregasi per sekolah/kelas/area/subarea/indikator, tanpa ranking/leaderboard.
- Jangan hard-code data siswa, centang, tulisan tangan, nilai, nama guru/kepala sekolah, tanggal, atau stempel dari referensi fisik.
- Jangan membuat logika bisnis berdasarkan nomor halaman.
- Semua teks UI, PDF, dan komunikasi pengguna memakai Bahasa Indonesia.
