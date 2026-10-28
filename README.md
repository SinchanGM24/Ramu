# RAMU

RAMU (_Raport Murid_) adalah platform SaaS multi-tenant untuk TK/PAUD yang membantu sekolah menyusun, meninjau, menerbitkan, dan membagikan raport murid secara aman.

## Tujuan

RAMU mengurangi pekerjaan administratif dalam penyusunan raport sambil mempertahankan peran guru dan sekolah atas seluruh keputusan penilaian, peninjauan, dan publikasi.

## Kemampuan utama

- Mengelola profil sekolah, tahun ajaran, kelas, staf, murid, serta kontak wali.
- Mendukung penilaian individual per murid dengan skala perkembangan PAUD.
- Menyediakan alur raport dari draf, pengajuan, peninjauan, persetujuan, hingga publikasi.
- Membuat versi raport dan PDF yang immutable setelah diterbitkan.
- Membagikan raport terbit kepada wali melalui tautan aman dan PIN tanpa membuat akun wali.
- Menyediakan riwayat pengiriman, audit trail, serta analitik agregat internal sekolah tanpa pemeringkatan murid.

## Prinsip produk

- Setiap sekolah adalah tenant yang terisolasi.
- Penilaian dilakukan per murid, bukan secara massal.
- Raport yang telah dipublikasikan tidak diubah; koreksi dibuat sebagai versi baru.
- Akses wali bersifat terbatas, sementara, dan hanya-baca.
- Bantuan AI hanya dapat membantu draf narasi atau pemeriksaan kelengkapan/konsistensi; AI tidak menilai, menyetujui, menerbitkan, memberi peringkat, atau mendiagnosis murid.

## Fondasi teknologi

- Frontend: Next.js, React, TypeScript, dan Tailwind CSS.
- Backend: NestJS/Fastify, TypeScript, dan PostgreSQL.
- Infrastruktur pendukung: Redis, penyimpanan objek yang kompatibel S3, serta proses latar belakang untuk pekerjaan pengiriman.

## Lisensi

RAMU adalah perangkat lunak proprietary dan rahasia. Hak cipta dilindungi; kode sumber, dokumentasi, desain, dan materi terkait tidak boleh disalin, dimodifikasi, didistribusikan, disublisensikan, dipublikasikan, atau digunakan untuk membuat karya turunan tanpa izin tertulis dari pemegang hak cipta. Lihat [LICENSE](LICENSE) untuk ketentuan lengkap. Komponen pihak ketiga tetap tunduk pada lisensi masing-masing.
