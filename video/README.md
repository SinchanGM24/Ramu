# Video promosi RAMU

Proyek Remotion ini memakai aplikasi RAMU utama dan database aktif sebagai
sumber visual. Dashboard, formulir, penilaian, dan raport tidak digambar ulang
di Remotion.

## Menjalankan studio

```bash
npm run video:studio
```

## Produksi dari aplikasi utama

1. Jalankan frontend dan backend utama tanpa `NEXT_PUBLIC_DEMO_MODE`.
2. Salin `video/.env.capture.example` menjadi environment lokal, lalu isi akun
   peran, raport DRAFT, raport PUBLISHED, serta akses wali yang disetujui.
3. Jalankan:

```bash
npm run capture:main -w @ramu/promo-video
npm run video:generate:music
npm run generate:sfx -w @ramu/promo-video
npm run video:render:desktop
npm run validate:final -w @ramu/promo-video
```

`capture:main` memakai Chromium desktop 1920x1080, memverifikasi sesi backend
utama, ukuran viewport, dan overflow horizontal. Capture ditolak bila
`RAMU_VIDEO_SOURCE=main` tidak disetel atau mode demo aktif.

Mode default tidak melakukan write. Dengan `RAMU_VIDEO_ALLOW_WRITE=true`, skrip
hanya mendemonstrasikan satu pilihan indikator dan pembuatan draf narasi pada
raport yang dipilih. Skrip tidak pernah mengirim WhatsApp, menyetujui, atau
menerbitkan raport.

## Komposisi

- `RamuPromoDesktop`: default 1920x1080, 49 detik, 30 FPS (1.470 frame).
- `RamuPromoReels`: 1080x1920, 49 detik, 30 FPS; adaptasi portrait dengan alur dan aksi yang sama.
- Audio: instrumental original 112 BPM dan lapisan efek gerak; tanpa narator.
- Output: `video/out/ramu-promo-premium-v7-hd.mp4` (Full HD, sumber tangkapan 2x, CRF 12).
- Output Reels: `video/out/ramu-promo-reels-v7-hd.mp4` (1080x1920, CRF 12).

Resolusi, FPS, dan durasi dapat diubah memakai `RAMU_VIDEO_WIDTH`,
`RAMU_VIDEO_HEIGHT`, `RAMU_VIDEO_FPS`, dan `RAMU_VIDEO_DURATION_SECONDS`.

Cerita dimulai dari landing page, dilanjutkan persiapan sekolah, pengisian data
murid, penilaian individual, draf Smart Narrative, tinjauan, penerbitan, dan
akses wali melalui tautan serta PIN. Tampilan wali tetap baca-saja.

Remotion menyusun capture desktop asli sebagai lembar kerja yang bergerak,
menambahkan colour chapters, karakter pendamping, typography, focus ring,
role handoff, workflow rail, smooth pan/zoom, dan match-cut transition. FFmpeg
memvalidasi durasi, resolusi, FPS, H.264, dan AAC berdasarkan konfigurasi.
