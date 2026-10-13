# Sistem desain RAMU

Dokumen ini adalah acuan visual seluruh frontend RAMU. Semua antarmuka memakai Bahasa Indonesia dan harus mempertahankan perilaku, data, serta otorisasi yang sudah berlaku.

## Arah visual

- **Karakter:** hangat, tenang, profesional, dan ramah untuk sekolah PAUD; bukan tampilan anak-anak yang ramai.
- **Permukaan:** ivory sebagai latar aplikasi, paper sebagai panel utama, dan forest green sebagai identitas serta aksi utama.
- **Kedalaman:** gunakan border lembut atau shadow hijau tipis. Jangan menumpuk kartu tanpa hierarki yang jelas.
- **Dekorasi:** pola botani/SVG hanya sebagai aksen tidak-interaktif; tidak boleh mengganggu data, tabel, form, PDF, maupun print.

## Token

| Peran | Nilai |
| --- | --- |
| Latar aplikasi | `#f8f5ed` |
| Permukaan utama | `#fffdf8` |
| Teks utama | `#17251b` |
| Teks sekunder | `#637065` |
| Border | `#e5e7dd` |
| Forest utama | `brand-700` / `#2c704d` |
| Forest gelap | `brand-900` / `#1e553a` |
| Sukses | hijau lembut |
| Peringatan | amber lembut |
| Bahaya | merah lembut |

Gunakan radius `rounded-xl` untuk kontrol dan `rounded-2xl` untuk panel. Bayangan menggunakan `shadow-soft` atau `shadow-panel`; jangan memakai shadow hitam kasar.

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

Aset dekoratif orisinal disimpan di `frontend/public/brand/`. Jangan menggunakan screenshot referensi sebagai aset aplikasi, jangan memakai data murid/sekolah nyata, dan selalu beri `alt` untuk gambar bermakna.
