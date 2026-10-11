# Audit Skalabilitas Halaman RAMU

Audit ini memisahkan halaman berdasarkan jumlah data yang realistis, agar pagination tidak ditambahkan pada halaman detail atau editor yang justru akan mengganggu alur kerja.

| Halaman/area | Risiko pertumbuhan data | Keputusan |
| --- | --- | --- |
| Murid | Tinggi; seluruh murid sekolah | Pagination server, pencarian nama/nomor induk yang didebounce, filter kelas. Selesai. |
| Perpindahan & Kelulusan | Tinggi; pemilihan batch murid | Pertahankan pemilihan batch dan filter kelas. Berikutnya perlu pagination yang tidak menghapus pilihan antarhalaman. |
| Arsip | Tinggi; bertambah setiap tahun | Perlu pagination dan pencarian didebounce untuk arsip serta riwayat administratif. |
| Pusat rapor | Tinggi; satu baris per murid per semester | Pencarian didebounce dan pagination per status. Selesai. |
| Tinjauan rapor | Menengah–tinggi saat periode rapor | Perlu pencarian didebounce, filter tahap, dan pagination. |
| Kelola akun | Menengah | Pencarian didebounce dan pagination server. Selesai. |
| Kelas/tahun ajaran | Rendah | Pencarian tahun sudah tersedia; pagination belum diperlukan karena jumlah kelas/tahun relatif kecil. |
| Kontak wali, riwayat kelas, riwayat rapor | Rendah per murid | Tidak perlu pagination pada MVP; data selalu dalam konteks satu murid. |
| Pengiriman rapor | Rendah per versi rapor | Tidak perlu pagination; penerima dibatasi kontak wali satu murid. |
| Editor/penilaian rapor | Tetap per satu murid | Tidak boleh dipaginasi sebagai daftar murid; accordion area sudah tepat. |
| Portofolio | Rendah pada MVP | Gunakan pagination bila sekolah mulai menampung banyak foto per rapor. |
| Profil sekolah/akun, login, registrasi, dashboard, parent viewer | Bukan daftar besar | Pagination dan pencarian tidak diperlukan. |

## Prinsip implementasi

- Semua pencarian teks ditunda 300 ms agar tidak membuat permintaan saat setiap karakter diketik.
- Daftar tenant besar memakai pagination di server, bukan memuat seluruh data ke browser.
- Filter mengembalikan halaman ke halaman pertama.
- Pagination tidak boleh memecah pilihan batch secara diam-diam; halaman lifecycle memerlukan model pilihan lintas halaman sebelum pagination ditambahkan.
