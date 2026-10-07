# Demo GitHub Pages

GitHub Pages hanya menerbitkan tampilan statis RAMU. Ia tidak menjalankan API NestJS, PostgreSQL, Redis, MinIO, autentikasi nyata, atau data sekolah sungguhan.

Workflow `.github/workflows/deploy-pages.yml` membangun frontend dengan `NEXT_PUBLIC_DEMO_MODE=true`. Dalam mode ini respons API berasal dari fixture demo di browser dan aksi formulir hanya menyimulasikan pengalaman penggunaan.

Perubahan demo hanya berlaku selama tab browser terbuka dan akan kembali ke data contoh saat halaman dimuat ulang. Jangan masukkan data murid, rahasia, token, atau URL database nyata ke branch ini.

## Mengaktifkan

1. Buka **Settings → Pages** di repositori GitHub.
2. Pilih **GitHub Actions** sebagai sumber deployment.
3. Izinkan branch `demo` pada environment `github-pages` bila environment protection rules aktif.
4. Push ke branch `demo` atau jalankan workflow **Deploy RAMU demo to GitHub Pages** secara manual.

Branch `main` menyimpan aplikasi RAMU sebenarnya. Branch `demo` berisi pengalaman publik dengan persona Admin Sekolah, Guru, Kepala Sekolah, dan akses wali contoh. Akses wali memakai tautan contoh dan PIN demo `123456`; ini bukan akun wali dan tidak terhubung ke backend nyata.

Untuk repositori `SinchanGM24/Ramu`, demo memakai base path `/Ramu` dan akan tersedia di `https://sinchangm24.github.io/Ramu/` setelah workflow berhasil.
