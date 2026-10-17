# Retensi Data dan Pertumbuhan Tabel

## Kebijakan bawaan

- Sesi staf yang kedaluwarsa dihapus pada proses pembersihan berikutnya.
- Sesi staf yang telah dicabut disimpan selama 30 hari secara bawaan, lalu dihapus.
- Sesi akses wali selalu dihapus setelah kedaluwarsa.
- Audit log tidak dihapus secara bawaan. Operator harus menetapkan `AUDIT_RETENTION_DAYS` setelah menentukan kebutuhan operasional atau hukum sekolah.

Proses pembersihan berjalan saat API mulai dan setiap 60 menit. Nilainya dapat disesuaikan tanpa mengubah kode:

```env
SESSION_RETENTION_DAYS=30
AUDIT_RETENTION_DAYS=730
RETENTION_CLEANUP_INTERVAL_MINUTES=60
```

`AUDIT_RETENTION_DAYS` minimal 30 hari. Nilai 730 hari hanyalah rekomendasi awal, bukan kebijakan wajib.

## Pemantauan

Setiap proses pembersihan menulis log terstruktur `data_retention.cleanup_completed`, berisi jumlah record yang dibersihkan dan ukuran fisik tabel `sessions`, `parent_report_sessions`, serta `audit_logs`. Log tidak memuat token, data murid, nomor telepon, atau isi audit.

## Strategi saat data bertumbuh

Indeks cleanup telah tersedia untuk expiry/revocation sesi dan waktu audit. Sebelum `audit_logs` mendekati 5 GB atau puluhan juta baris, lakukan migrasi terencana untuk partisi bulanan berdasarkan `created_at`. Jangan mengubah tabel audit menjadi partisi secara langsung saat jam sekolah aktif; lakukan backup, uji restore, serta verifikasi RLS dan audit trail pada staging terlebih dahulu.
