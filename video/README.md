# Video promosi RAMU

Proyek Remotion ini terpisah dari aplikasi utama. Video menggunakan komponen
React sehingga naskah, warna, CTA, dan format dapat disesuaikan tanpa mengubah
frontend RAMU.

## Menjalankan studio

```bash
npm run video:studio
```

## Render

```bash
npm run video:render:desktop
npm run video:render:reels
```

Hasil MP4 tersimpan di `video/out/`, yang sengaja tidak dilacak Git.

## Komposisi

- `RamuPromoDesktop`: 1920 x 1080, 60 detik, 30 FPS.
- `RamuPromoReels`: 1080 x 1920, 60 detik, 30 FPS.

Cerita mengikuti alur RAMU yang sebenarnya: Admin Sekolah menata data akademik,
Guru mengisi raport individu, Guru mengirim untuk tinjauan, Kepala Sekolah
menyetujui atau meminta revisi, Admin Sekolah menerbitkan, lalu wali membuka
raport melalui tautan dan PIN pribadi.

Ilustrasi sekolah, anak, dan wali disimpan sebagai aset lokal di
`public/illustrations/`. Ilustrasi hanya menjadi aksen naratif dan tidak
menggantikan representasi UI alur produk.

Naskah voice-over dan arahan musik tersedia di [VOICE_OVER.md](./VOICE_OVER.md).
Komposisi dibuat tanpa audio bawaan agar musik serta rekaman suara dapat dipilih
sesuai lisensi dan kebutuhan kampanye.
