# Rencana Implementasi RAMU

Dokumen ini adalah urutan kerja produk setelah refactor siklus akademik. Tujuannya agar RAMU siap dipakai sekolah untuk satu siklus raport nyata sebelum penguatan keamanan dan kesiapan produksi dilakukan.

## Keputusan produk yang sudah ditetapkan

- Tahun ajaran dibuat manual oleh admin. Sistem membuat Semester I dan Semester II.
- Kelas adalah nama sekolah yang dapat digunakan kembali lintas tahun ajaran. Form operasional memilih satu nama kelas; pencatatan per tahun ajaran hanya terjadi di belakang layar untuk riwayat dan raport.
- Perpindahan kelas dan kelulusan adalah tindakan administratif. Publikasi raport adalah tindakan akademik. Tidak ada perubahan otomatis.
- Seorang kelas dapat memiliki beberapa guru dengan hak kerja yang setara. Tidak ada guru utama.
- Riwayat penempatan dan raport melekat pada murid, termasuk setelah murid diarsipkan.
- Framework penilaian memakai standar PAUD yang sama untuk setiap sekolah pada MVP.
- Semua teks pengguna menggunakan Bahasa Indonesia.
- Admin Sekolah adalah satu-satunya peran yang menerbitkan raport setelah persetujuan Kepala Sekolah. Guru maupun Kepala Sekolah tidak dapat menerbitkan raport.
- Guru dapat melihat Arsip seluruh murid dalam sekolahnya untuk kebutuhan riwayat, tetapi hanya-baca dan tidak dapat membatalkan kelulusan atau mengubah data administratif arsip.

## Status pondasi saat ini

Sudah tersedia:

- Tahun ajaran, semester, kelas yang dapat dipakai ulang, penugasan beberapa guru, dan penempatan murid historis.
- Struktur lama tingkatan, kenaikan/mengulang, guru utama, dan pemilihan kelas ganda per tahun ajaran telah dipensiunkan dari kontrak aplikasi. Migrasi baru mempertahankan penempatan historis lalu menghapus kolom/tabel yang tidak lagi dipakai.
- Pengajuan guru disimpan terpisah dari operasi perpindahan atau kelulusan yang sudah diterapkan. Persetujuan Kepala Sekolah membuat operasi final beserta audit trail dalam satu transaksi.
- Perpindahan kelas, kelulusan, pembatalan kelulusan, dan Arsip.
- Data murid, profil, beberapa kontak wali, serta kontak utama.
- Alur raport individual, review, persetujuan, penerbitan versi/PDF, akses wali melalui PIN, dan pengiriman raport.
- Logo/profil sekolah dan snapshot pada raport terbit.
- Riwayat kelas serta daftar raport terbit pada profil murid.

Masih perlu diselesaikan sebelum pengujian alur sekolah sebenarnya:

- Halaman riwayat harus selalu membuka representasi versi raport yang immutable.
- Pengelolaan raport terbit dan pengiriman wali perlu satu alur admin yang lebih jelas.
- Workspace guru, onboarding, Arsip, dan analitik masih membutuhkan penyempurnaan.

## Prioritas pengerjaan

### Fase 1 — Raport terbit dan pengiriman wali

Tujuan: admin dapat menyelesaikan raport dari progres sampai wali menerimanya tanpa kehilangan konteks.

1. Riwayat raport immutable — selesai

   - Tautan pada profil murid membuka snapshot versi raport atau PDF tersimpan.
   - Riwayat menampilkan tahun ajaran, semester, tanggal terbit, dan nomor versi.
   - Koreksi raport membuat versi baru tanpa mengubah versi lama.

2. Pusat kerja raport admin — selesai

   - Pisahkan daftar: progres pengisian, perlu ditinjau, siap diterbitkan, sudah terbit — selesai.
   - Tampilkan alasan yang dapat ditindaklanjuti apabila raport belum dapat dikirim/diterbitkan — selesai.
   - Beri navigasi jelas dari daftar ke murid, editor, pratinjau, dan pengiriman — selesai.

3. Pengiriman kepada wali — selesai
   - Admin dapat memilih kontak penerima yang aktif untuk setiap raport — selesai.
   - Tampilkan status pengiriman melalui ikon: kirim netral sebelum chat dibuka dan centang setelah chat WhatsApp dibuka — selesai.
   - Sediakan kirim ulang untuk pengiriman gagal — selesai.
   - Tampilkan riwayat pengiriman per raport — selesai.
   - Mode tanpa API membuka chat WhatsApp personal dengan tautan dan PIN unik, lalu mencatat bahwa chat telah dibuka. Status diterima/dibaca tetap memerlukan provider resmi — selesai.
   - Pengiriman dan pembuatan tautan wali dibatasi untuk Admin Sekolah atau Guru pada kelas yang ditugaskan; Kepala Sekolah tidak dapat menjalankan aksi kirim — selesai.
   - Nomor tidak valid dan pop-up browser yang diblokir gagal tanpa mengubah status pengiriman; raport murid pada Arsip tetap dapat dibagikan — selesai.

Kriteria selesai:

- Satu raport dapat diterbitkan, dibuka ulang sebagai versi immutable, dikirim, dan ditelusuri statusnya.
- Tidak ada perubahan data penilaian yang mengubah PDF atau snapshot versi terbit.

### Fase 2 — Workspace guru

Tujuan: guru hanya mengerjakan murid pada kelas yang ditugaskan, satu murid dalam satu waktu.

1. Halaman kerja guru

   - Admin menetapkan kelas dan semester kerja guru melalui penugasan. Guru tidak dapat memilih kelas atau semester di luar penugasan tersebut.
   - Jika guru memiliki lebih dari satu penugasan aktif, ia hanya dapat berpindah di antara konteks yang telah ditetapkan admin; konteks aktif dapat langsung dibuka sebagai halaman awal.
   - Daftar murid dengan status Bahasa Indonesia: Belum dimulai, Sebagian terisi, Lengkap.
   - Aksi utama jelas: lanjutkan pengisian atau mulai raport.

2. Editor raport

   - Penilaian individual, narasi, pertumbuhan, kehadiran semester, ekstrakurikuler, dan portofolio mudah dijangkau.
   - Autosave serta status tersimpan/gagal tersimpan terlihat jelas.
   - Guru dapat mengirim raport hanya jika persyaratan lengkap.

3. Batas akses guru dan persetujuan
   - Guru hanya melihat daftar murid aktif dari kelas yang ditugaskan untuk pekerjaan raport dan data murid.
   - Guru dapat membuat pengajuan perpindahan atau kelulusan; pengajuan tidak mengubah penempatan maupun status murid sebelum disetujui Kepala Sekolah.
   - Guru dapat melihat Arsip seluruh sekolah secara hanya-baca.
   - Setelah Kepala Sekolah menyetujui raport, Admin Sekolah menerbitkan versi immutable. Sesudah penerbitan, guru dapat mengirim raport hanya kepada wali murid pada kelas yang ditugaskan; Admin Sekolah dapat mengirim untuk semua kelas.

Kriteria selesai:

- Guru tidak dapat melihat atau mengubah murid/konteks di luar penugasannya.
- Guru dapat menyelesaikan dan mengirim satu raport tanpa bantuan admin.

### Fase 3 — Onboarding dan alur administrasi

Tujuan: sekolah baru memahami urutan persiapan tanpa harus memahami struktur teknis RAMU.

1. Checklist awal sekolah

   - Lengkapi profil dan logo sekolah.
   - Tambah tahun ajaran.
   - Tambah kelas.
   - Tambah akun dan tugaskan guru.
   - Tambah serta tempatkan murid.
   - Mulai pengisian raport.

2. Penyempurnaan data akademik

- Tahun ajaran aktif dipakai internal ketika sistem membuat riwayat penempatan; pengguna tidak memilih salinan kelas berdasarkan tahun saat menambah murid.
  - Penjelasan konteks tahun ajaran aktif pada setiap halaman terkait.
  - Validasi yang mudah dipahami sebelum kelas, guru, atau murid dapat dipakai.

Kriteria selesai:

- Admin sekolah baru dapat menyiapkan kelas pertama tanpa dokumentasi teknis.

### Fase 4 — Arsip, aktivitas, dan analitik

Tujuan: admin dapat menelusuri perjalanan murid dan memantau kesiapan sekolah.

1. Arsip

   - Filter tahun kelulusan dan pencarian murid.
   - Detail murid arsip menampilkan riwayat kelas dan raport terbit.
   - Pembatalan kelulusan memakai modal beralasan, bukan dialog browser.

2. Riwayat aktivitas

   - Tampilkan aktivitas penting: penempatan, perpindahan, kelulusan, pembatalan kelulusan, penugasan guru, penerbitan raport.
   - Setiap entri menampilkan aktor, waktu, alasan bila ada, dan murid terdampak.

3. Analitik internal
   - Jumlah murid aktif per kelas.
   - Progres raport per kelas.
   - Jumlah raport menurut tahap workflow.
   - Ringkasan perkembangan per area dan skala, tanpa peringkat murid.

Kriteria selesai:

- Admin dapat menjawab “siapa melakukan apa” dan “kelas mana yang belum siap raport” dari aplikasi.

### Fase 5 — Poles UX dan pengujian alur nyata

Tujuan: seluruh perjalanan terasa konsisten sebelum keamanan diperketat.

- Ganti seluruh `window.confirm` dan `window.prompt` dengan dialog/modal aplikasi.
- Samakan pola tabel, filter, empty state, toast/notifikasi, loading, dan error.
- Uji satu skenario sekolah nyata dari tahun ajaran baru sampai murid lulus/diarsipkan.
- Uji data contoh serta seed agar tidak lagi memuat istilah lama seperti tingkatan, kenaikan kelas, atau guru utama. Selesai untuk demo dan struktur basis data; tetap dijalankan kembali saat seed berikutnya berubah.

Kriteria selesai:

- Tidak ada istilah internal/raw status yang muncul ke pengguna.
- Tidak ada alur penting yang bergantung pada prompt browser atau langkah tersembunyi.

### Fase 6 — Keamanan dan kesiapan produksi

Fase ini dimulai setelah Fase 1–5 lolos pengujian fungsi.

- Audit tenant isolation pada semua query dan mutation.
- Verifikasi RLS, RBAC, dan akses guru berdasarkan penugasan.
- Uji immutability raport terbit dan akses wali berbasis token/PIN.
- Uji upload file, object storage, rate limit, validasi input, audit log, backup/restore, observability, dan deployment.
- Tambahkan test regresi untuk semua alur kritis.

## Fitur tambahan setelah MVP inti

Fitur berikut bermanfaat, tetapi tidak boleh mendahului Fase 1–5:

- Import murid dari Excel/CSV dengan pratinjau dan validasi.
- Ekspor daftar murid/kelas/raport untuk administrasi sekolah.
- Filter lanjutan yang konsisten pada murid, raport, Arsip, dan riwayat aktivitas.
- Notifikasi internal untuk raport yang perlu ditinjau atau pengiriman yang gagal.

Tetap di luar ruang lingkup:

- Peringkat murid, presensi harian, LMS, keuangan/SPP, payroll, chat, dan akun wali.

## Urutan tindakan berikutnya

1. Kerjakan Fase 1: riwayat raport immutable dan pusat kerja raport.
2. Uji alur lengkap penerbitan serta pengiriman raport.
3. Kerjakan Fase 2 untuk memvalidasi pengalaman guru.
4. Lanjutkan Fase 3–5 sampai alur sekolah nyata selesai.
5. Baru jalankan Fase 6 sebagai audit keamanan dan kesiapan produksi.
