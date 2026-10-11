# Rencana Implementasi RAMU

Dokumen ini adalah urutan kerja produk setelah refactor siklus akademik. Tujuannya agar RAMU siap dipakai sekolah untuk satu siklus rapor nyata sebelum penguatan keamanan dan kesiapan produksi dilakukan.

## Keputusan produk yang sudah ditetapkan

- Tahun ajaran dibuat manual oleh admin. Sistem membuat Semester I dan Semester II.
- Kelas adalah nama yang dapat digunakan kembali lintas tahun ajaran; tidak ada tingkatan kelas yang mengatur perpindahan.
- Perpindahan kelas dan kelulusan adalah tindakan administratif. Publikasi rapor adalah tindakan akademik. Tidak ada perubahan otomatis.
- Seorang kelas dapat memiliki beberapa guru dengan hak kerja yang setara. Tidak ada guru utama.
- Riwayat penempatan dan rapor melekat pada murid, termasuk setelah murid diarsipkan.
- Framework penilaian memakai standar PAUD yang sama untuk setiap sekolah pada MVP.
- Semua teks pengguna menggunakan Bahasa Indonesia.

## Status pondasi saat ini

Sudah tersedia:

- Tahun ajaran, semester, kelas yang dapat dipakai ulang, penugasan beberapa guru, dan penempatan murid historis.
- Perpindahan kelas, kelulusan, pembatalan kelulusan, dan Arsip.
- Data murid, profil, beberapa kontak wali, serta kontak utama.
- Alur rapor individual, review, persetujuan, penerbitan versi/PDF, akses wali melalui PIN, dan pengiriman rapor.
- Logo/profil sekolah dan snapshot pada rapor terbit.
- Riwayat kelas serta daftar rapor terbit pada profil murid.

Masih perlu diselesaikan sebelum pengujian alur sekolah sebenarnya:

- Halaman riwayat harus selalu membuka representasi versi rapor yang immutable.
- Pengelolaan rapor terbit dan pengiriman wali perlu satu alur admin yang lebih jelas.
- Workspace guru, onboarding, Arsip, dan analitik masih membutuhkan penyempurnaan.

## Prioritas pengerjaan

### Fase 1 — Rapor terbit dan pengiriman wali

Tujuan: admin dapat menyelesaikan rapor dari progres sampai wali menerimanya tanpa kehilangan konteks.

1. Riwayat rapor immutable — selesai
   - Tautan pada profil murid membuka snapshot versi rapor atau PDF tersimpan.
   - Riwayat menampilkan tahun ajaran, semester, tanggal terbit, dan nomor versi.
   - Koreksi rapor membuat versi baru tanpa mengubah versi lama.

2. Pusat kerja rapor admin — dalam pengerjaan
   - Pisahkan daftar: progres pengisian, perlu ditinjau, siap diterbitkan, sudah terbit — selesai.
   - Tampilkan alasan yang dapat ditindaklanjuti apabila rapor belum dapat dikirim/diterbitkan.
   - Beri navigasi jelas dari daftar ke murid, editor, pratinjau, dan pengiriman — selesai.

3. Pengiriman kepada wali
   - Admin dapat memilih kontak penerima yang aktif untuk setiap rapor — selesai.
   - Tampilkan status pengiriman dalam Bahasa Indonesia: Menunggu dikirim, Terkirim, Dibaca, Gagal.
   - Sediakan kirim ulang untuk pengiriman gagal.
   - Tampilkan riwayat pengiriman per rapor.

Kriteria selesai:

- Satu rapor dapat diterbitkan, dibuka ulang sebagai versi immutable, dikirim, dan ditelusuri statusnya.
- Tidak ada perubahan data penilaian yang mengubah PDF atau snapshot versi terbit.

### Fase 2 — Workspace guru

Tujuan: guru hanya mengerjakan murid pada kelas yang ditugaskan, satu murid dalam satu waktu.

1. Halaman kerja guru
   - Pilihan kelas dan semester yang memang ditugaskan kepada guru tersebut.
   - Daftar murid dengan status Bahasa Indonesia: Belum dimulai, Sebagian terisi, Lengkap.
   - Aksi utama jelas: lanjutkan pengisian atau mulai rapor.

2. Editor rapor
   - Penilaian individual, narasi, pertumbuhan, kehadiran semester, ekstrakurikuler, dan portofolio mudah dijangkau.
   - Autosave serta status tersimpan/gagal tersimpan terlihat jelas.
   - Guru dapat mengirim rapor hanya jika persyaratan lengkap.

Kriteria selesai:

- Guru tidak dapat melihat atau mengubah murid/konteks di luar penugasannya.
- Guru dapat menyelesaikan dan mengirim satu rapor tanpa bantuan admin.

### Fase 3 — Onboarding dan alur administrasi

Tujuan: sekolah baru memahami urutan persiapan tanpa harus memahami struktur teknis RAMU.

1. Checklist awal sekolah
   - Lengkapi profil dan logo sekolah.
   - Tambah tahun ajaran.
   - Tambah kelas.
   - Tambah akun dan tugaskan guru.
   - Tambah serta tempatkan murid.
   - Mulai pengisian rapor.

2. Penyempurnaan data akademik
   - UI duplikasi struktur kelas dari tahun sebelumnya.
   - Penjelasan konteks tahun ajaran aktif pada setiap halaman terkait.
   - Validasi yang mudah dipahami sebelum kelas, guru, atau murid dapat dipakai.

Kriteria selesai:

- Admin sekolah baru dapat menyiapkan kelas pertama tanpa dokumentasi teknis.

### Fase 4 — Arsip, aktivitas, dan analitik

Tujuan: admin dapat menelusuri perjalanan murid dan memantau kesiapan sekolah.

1. Arsip
   - Filter tahun kelulusan dan pencarian murid.
   - Detail murid arsip menampilkan riwayat kelas dan rapor terbit.
   - Pembatalan kelulusan memakai modal beralasan, bukan dialog browser.

2. Riwayat aktivitas
   - Tampilkan aktivitas penting: penempatan, perpindahan, kelulusan, pembatalan kelulusan, penugasan guru, penerbitan rapor.
   - Setiap entri menampilkan aktor, waktu, alasan bila ada, dan murid terdampak.

3. Analitik internal
   - Jumlah murid aktif per kelas.
   - Progres rapor per kelas.
   - Jumlah rapor menurut tahap workflow.
   - Ringkasan perkembangan per area dan skala, tanpa peringkat murid.

Kriteria selesai:

- Admin dapat menjawab “siapa melakukan apa” dan “kelas mana yang belum siap rapor” dari aplikasi.

### Fase 5 — Poles UX dan pengujian alur nyata

Tujuan: seluruh perjalanan terasa konsisten sebelum keamanan diperketat.

- Ganti seluruh `window.confirm` dan `window.prompt` dengan dialog/modal aplikasi.
- Samakan pola tabel, filter, empty state, toast/notifikasi, loading, dan error.
- Uji satu skenario sekolah nyata dari tahun ajaran baru sampai murid lulus/diarsipkan.
- Uji data contoh serta seed agar tidak lagi memuat istilah lama seperti tingkatan, kenaikan kelas, atau guru utama.

Kriteria selesai:

- Tidak ada istilah internal/raw status yang muncul ke pengguna.
- Tidak ada alur penting yang bergantung pada prompt browser atau langkah tersembunyi.

### Fase 6 — Keamanan dan kesiapan produksi

Fase ini dimulai setelah Fase 1–5 lolos pengujian fungsi.

- Audit tenant isolation pada semua query dan mutation.
- Verifikasi RLS, RBAC, dan akses guru berdasarkan penugasan.
- Uji immutability rapor terbit dan akses wali berbasis token/PIN.
- Uji upload file, object storage, rate limit, validasi input, audit log, backup/restore, observability, dan deployment.
- Tambahkan test regresi untuk semua alur kritis.

## Fitur tambahan setelah MVP inti

Fitur berikut bermanfaat, tetapi tidak boleh mendahului Fase 1–5:

- Import murid dari Excel/CSV dengan pratinjau dan validasi.
- Ekspor daftar murid/kelas/rapor untuk administrasi sekolah.
- Filter lanjutan yang konsisten pada murid, rapor, Arsip, dan riwayat aktivitas.
- Notifikasi internal untuk rapor yang perlu ditinjau atau pengiriman yang gagal.

Tetap di luar ruang lingkup:

- Peringkat murid, presensi harian, LMS, keuangan/SPP, payroll, chat, dan akun wali.

## Urutan tindakan berikutnya

1. Kerjakan Fase 1: riwayat rapor immutable dan pusat kerja rapor.
2. Uji alur lengkap penerbitan serta pengiriman rapor.
3. Kerjakan Fase 2 untuk memvalidasi pengalaman guru.
4. Lanjutkan Fase 3–5 sampai alur sekolah nyata selesai.
5. Baru jalankan Fase 6 sebagai audit keamanan dan kesiapan produksi.
