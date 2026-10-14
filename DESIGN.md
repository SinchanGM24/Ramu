# Sistem desain RAMU

Dokumen ini adalah acuan visual seluruh frontend RAMU. Semua antarmuka memakai Bahasa Indonesia dan harus mempertahankan perilaku, data, serta otorisasi yang sudah berlaku.

## Arah visual

- **Karakter:** hangat, tenang, profesional, dan ramah untuk sekolah PAUD; bukan tampilan anak-anak yang ramai.
- **Permukaan:** ivory sebagai latar aplikasi, paper sebagai panel utama, dan forest green sebagai identitas serta aksi utama.
- **Kedalaman:** gunakan border lembut atau shadow hijau tipis. Jangan menumpuk kartu tanpa hierarki yang jelas.
- **Dekorasi:** pola botani/SVG hanya sebagai aksen tidak-interaktif; tidak boleh mengganggu data, tabel, form, PDF, maupun print.

## Token

| Peran                   | Nilai                   |
| ----------------------- | ----------------------- |
| Latar aplikasi          | `#f8f5ed`               |
| Permukaan utama         | `#fffdf8`               |
| Teks utama              | `#17251b`               |
| Teks sekunder           | `#637065`               |
| Border                  | `#e5e7dd`               |
| Hijau interaktif        | `brand-700` / `#174b31` |
| Hijau permukaan dominan | `#2c704d`               |
| Sukses                  | hijau lembut            |
| Peringatan              | amber lembut            |
| Bahaya                  | merah lembut            |

Gunakan radius `rounded-xl` untuk kontrol dan `rounded-2xl` untuk panel. Bayangan menggunakan `shadow-soft` atau `shadow-panel`; jangan memakai shadow hitam kasar.

Gunakan `brand-*` untuk tombol, hover, link, focus ring, dan aksen. Untuk permukaan besar yang gelap—sidebar, panel autentikasi, hero status, dan header parent viewer—gunakan `#2c704d` agar tetap jelas tanpa terasa terlalu gelap.

## Komponen

- **Button:** satu aksi primer forest per area; aksi kedua outline/paper; aksi berisiko merah.
- **Card:** hanya untuk mengelompokkan informasi atau tindakan yang benar-benar berbeda.
- **Tabel:** header jelas, tinggi baris nyaman, filter dan aksi tidak bercampur, dan tetap dapat digulir pada layar kecil.
- **Form:** label di atas kontrol, bantuan atau validasi di bawahnya, dan fokus keyboard selalu terlihat.
- **Dialog:** gunakan untuk alur terfokus; backdrop lembut, Escape/backdrop mengikuti perilaku yang telah ditetapkan fitur.
- **Status:** gunakan badge lembut dengan label Bahasa Indonesia, bukan kode status internal.

## Responsivitas dan aksesibilitas

- Konten aplikasi dibatasi `max-w-7xl`; pada desktop sidebar tetap terbuka, pada mobile navigasi memakai topbar dan bottom navigation.
- Target interaksi minimal 40px, fokus keyboard terlihat, dan ikon tanpa teks wajib memiliki label aksesibel.
- Parent viewer diprioritaskan untuk layar kecil. Preview/PDF mempertahankan struktur formal dan aturan print.

## Aset

Gunakan ilustrasi orisinal yang dibuat khusus untuk RAMU dan simpan di `frontend/public/brand/`. Jangan menggunakan screenshot referensi sebagai aset aplikasi, jangan memakai data murid/sekolah nyata, dan selalu beri `alt` untuk gambar bermakna.

Ilustrasi hanya dipakai jika membantu orientasi, empty state, landing, autentikasi, atau identitas sekolah. Pilih tema sekolah, belajar, buku, kelas, alat tulis, atau botani pendukung. Hindari ilustrasi pada tabel padat, form kerja, editor raport, preview formal, dan PDF.

- Setiap aset diberi nama deskriptif dan dicatat di `frontend/public/brand/README.md`, termasuk lokasi pemakaian dan prompt ringkas pembuatannya.
- Jika suatu saat aset orisinal tidak memadai, sumber eksternal hanya boleh digunakan setelah lisensi komersialnya jelas dan dicatat di `ATTRIBUTION.md`.
- Jangan menggunakan foto stok generik, wajah anak nyata, gambar tanpa lisensi jelas, atau aset yang tidak dapat dipakai secara komersial.
- Jangan menaruh ilustrasi pada tabel padat, editor raport, preview formal, PDF, maupun area tindakan yang berisiko mengganggu fokus pengguna.
