# Video promosi RAMU

Proyek Remotion ini terpisah dari aplikasi utama. Video dibuat dari komponen React agar naskah, warna, CTA, dan ukuran dapat disesuaikan tanpa mengubah frontend RAMU.

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

- `RamuPromoDesktop`: 1920 × 1080, 50 detik, 30 FPS.
- `RamuPromoReels`: 1080 × 1920, 50 detik, 30 FPS.

Konten video mengikuti alur produk yang sebenarnya: kelola akademik, pengisian raport individual, tinjauan Kepala Sekolah, publikasi oleh Admin Sekolah, lalu akses wali melalui tautan dan PIN.

Naskah voice-over dan arahan musik tersedia di [`VOICE_OVER.md`](./VOICE_OVER.md). Komposisi dibuat tanpa audio bawaan agar musik serta rekaman suara dapat dipilih sesuai lisensi dan kebutuhan kampanye.
