# Demo GitHub Pages

GitHub Pages hanya menerbitkan tampilan statis RAMU. Ia tidak menjalankan API NestJS, PostgreSQL, Redis, MinIO, autentikasi nyata, atau data sekolah sungguhan.

Workflow `.github/workflows/deploy-pages.yml` membuat frontend dengan `NEXT_PUBLIC_DEMO_MODE=true`. Dalam mode ini semua respons API berasal dari fixture demo di browser dan aksi formulir hanya mensimulasikan pengalaman penggunaan.

Perubahan demo hanya berlaku selama tab browser terbuka dan akan kembali ke data contoh setelah halaman dimuat ulang. Tidak ada foto yang diunggah, akun, atau data rapor yang disimpan.

## Mengaktifkan

1. Buka **Settings → Pages** pada repositori GitHub.
2. Pilih **GitHub Actions** sebagai sumber deployment.
3. Push ke `main` atau jalankan workflow **Deploy RAMU demo to GitHub Pages** secara manual.

Untuk repositori `SinchanGM24/Ramu`, demo memakai base path `/Ramu` dan akan tersedia di `https://sinchangm24.github.io/Ramu/` setelah workflow berhasil.

Jangan masukkan rahasia, URL database, token, atau data murid asli ke frontend demo karena GitHub Pages bersifat publik.
