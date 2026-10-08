# RAMU Smart Narrative Engine

Dokumen ini adalah sumber kebenaran untuk generator draf narasi rapor RAMU. Ia melengkapi [PRD](PRD.md) dan `REPORT_SPEC.md`; struktur rapor, workflow, serta batas akses pada kedua dokumen tersebut tetap berlaku.

## Tujuan dan batasan

Smart Narrative Engine mengubah hasil penilaian indikator seorang anak dalam satu aspek perkembangan dan semester menjadi draf narasi yang hangat, jelas, dan dapat ditinjau guru.

- Engine bersifat deterministic dan rule-based; tidak memakai LLM, API AI, model lokal, atau layanan eksternal.
- Engine tidak pernah mengubah assessment, menyetujui, menerbitkan, memberi peringkat, atau mendiagnosis anak.
- Narasi adalah draf. Guru selalu dapat menyunting dan menyimpan hasilnya sebelum rapor memasuki workflow berikutnya.
- Seluruh sumber klaim harus dapat dilacak ke indikator dan nilai yang tersimpan dalam tenant sekolah yang sama.
- Generator runtime selalu membaca indikator template aktif dari database. Jumlah indikator tidak diasumsikan di dalam engine.

## Alur end-to-end

```text
Penilaian guru per indikator
  -> Semantic Analyzer
  -> Development Analyzer
  -> Narrative Planner
  -> Indonesian Language Composer
  -> Narrative Validator
  -> Draf siap ditinjau guru
  -> Preview / PDF / viewer wali memakai narasi tersimpan yang sama
```

Generator hanya tersedia saat seluruh indikator wajib pada area telah dinilai. Pengiriman rapor tetap menggunakan pemeriksaan kelengkapan yang berlaku.

## Kontrak data dan traceability

Input internal memuat identitas anak yang telah diotorisasi, sekolah, semester, aspek, assessment, dan metadata indikator. Browser tidak menjadi otoritas untuk `schoolId`, `studentId`, atau indikator.

Setiap hasil generasi menyimpan atau mengembalikan:

- `content` dan paragraf hasil;
- indikator sumber yang tercakup dan yang diabaikan;
- signature deterministik dari assessment, metadata, versi engine, dan konfigurasi gaya;
- versi engine, versi metadata, status cakupan, serta warning validasi;
- identitas aktor dan waktu generasi melalui audit log.

Input yang identik menghasilkan signature dan narasi yang identik. Signature mencakup nilai, metadata semantik, label narasi, tipe observasi, tag rekomendasi, versi metadata, dan versi engine agar perubahan aturan dapat dilacak. Engine V1 menggunakan gaya `warm_natural` dan panjang `medium`; variasi gaya atau panjang tidak dibuat sebelum kualitas dasar stabil.

## Metadata semantik indikator

Metadata berada pada data tenant-scoped yang berelasi langsung dengan `indicator_id`, bukan hasil pencocokan substring saat runtime. Metadata minimal memuat:

| Field | Kegunaan |
| --- | --- |
| `semanticGroup` | Mengelompokkan kemampuan yang memang berkaitan. |
| `competencyConcept` | Konsep kemampuan yang dinilai. |
| `narrativeLabel` | Bentuk kemampuan yang layak disebut pada narasi wali. |
| `observationType` | Membedakan keterampilan, keselamatan, dan pengukuran fisik. |
| `recommendationTags` | Rujukan rekomendasi stimulasi yang diizinkan. |

Semua 88 indikator pada template TK default dikurasi melalui seed idempoten. Indikator kustom tanpa metadata tidak diinterpretasikan: engine memakai label asli secara terbatas dan menambahkan warning untuk guru.

Indikator pertumbuhan fisik diperlakukan sebagai pengukuran. Engine tidak menyimpulkan kesehatan atau perkembangan motorik dari tinggi badan, berat badan, atau lingkar kepala tanpa acuan pengukuran yang sah.

## Aturan analisis dan perencanaan

- `BSB` menjadi kekuatan yang sangat menonjol; `BSH` menjadi capaian yang telah berkembang; `MB` menjadi kemampuan yang sedang bertumbuh; `BB` menjadi kebutuhan stimulasi yang suportif.
- Indikator yang belum dinilai berstatus `UNASSESSED`; ia tidak boleh dianggap sebagai `BB` dan tidak boleh menjadi sumber klaim.
- Urutan narasi: kekuatan/capaian positif, kemampuan yang sedang berkembang, lalu kebutuhan stimulasi bila terdapat `MB` atau `BB`.
- Rekomendasi hanya ditampilkan bila ada `MB` atau `BB`, dan harus berasal dari `recommendationTags` indikator sumber.
- Bahasa pendampingan mengikuti domain perkembangan: permainan untuk gerak tubuh, pembiasaan/teladan untuk agama dan moral, percakapan/cerita untuk bahasa, serta konteks relevan lain untuk kognitif, sosial emosional, seni, kesehatan, dan keselamatan.
- Narasi tidak boleh mengklaim kenaikan dibanding semester sebelumnya tanpa data pembanding yang sah.
- Jika sebuah kategori tidak memiliki indikator, bagian tersebut tidak dibuat.

## Aturan bahasa warm natural

Narasi menjelaskan perkembangan kepada wali, bukan mengulang tabel assessment.

- Sebut anak sebagai `Ananda {nama panggilan}`; bila nama panggilan kosong gunakan nama depan dari nama lengkap.
- Gunakan transisi terencana seperti “Selain itu”, “Sementara itu”, dan “Ke depannya”, bukan sambungan daftar dengan koma panjang.
- Prioritaskan kekuatan sebelum kebutuhan stimulasi.
- Gunakan bahasa konstruktif: “sedang mengembangkan”, “mendapat kesempatan berlatih”, dan “stimulasi dapat diberikan”.
- Jangan tampilkan kode `BB`, `MB`, `BSH`, atau `BSB` kepada wali di dalam narasi.
- Jangan menggunakan frasa “serta kemampuan terkait lainnya”, label negatif, diagnosis, atau aktivitas yang tidak berasal dari metadata/indikator.

Contoh arah kualitas:

> Selama semester ini, Ananda Alya menunjukkan kemampuan yang sangat baik dalam membuat berbagai bentuk garis dan lingkaran. Keterampilannya dalam menjiplak bentuk serta mengontrol gerakan tangan juga telah berkembang sesuai harapan. Sementara itu, pada kegiatan yang melibatkan melempar, menangkap, dan menendang secara terarah, Ananda Alya sedang mengembangkan koordinasi geraknya. Melalui permainan yang melibatkan melompat, meloncat, dan berlari, Ananda Alya dapat terus memperoleh kesempatan untuk melatih koordinasi tubuhnya.

## Validasi, status, dan editor

Sebelum hasil disimpan, validator memastikan klaim sesuai rating sumber, tidak memakai indikator belum dinilai, tidak memiliki rekomendasi tanpa sumber, tidak menginterpretasikan data pengukuran, dan tidak mengulang kalimat secara berlebihan.

Jika validasi serius gagal, engine mengembalikan warning atau fallback aman dan tidak mengganti narasi aktif. Jika assessment berubah setelah generasi terakhir, editor menampilkan bahwa draf mungkin perlu diperbarui. Menekan generate pada narasi yang sudah ada selalu meminta konfirmasi.

Tidak ada status finalisasi narasi tambahan. Narasi dapat diedit pada status rapor yang diizinkan (`DRAFT` dan `REVISION_REQUIRED`) dan mengikuti pembatasan workflow rapor yang ada.

## Keamanan dan lifecycle

- Semua metadata dan riwayat generasi membawa `school_id`, dibatasi RLS, dan diperiksa kembali oleh otorisasi server.
- Hanya admin sekolah atau guru wali kelas yang berwenang dapat menghasilkan atau menyimpan narasi untuk rapor yang dapat mereka akses.
- Parent viewer hanya menerima narasi dari snapshot versi rapor terbit; ia tidak dapat menghasilkan, mengubah, atau melihat metadata internal.
- Rapor terbit tidak boleh dimutasi. Koreksi mengikuti versi rapor baru yang berlaku.

## Pengujian wajib

- Unit test untuk semantic grouping, analisis seluruh kombinasi skala, planner, composer, validator, signature, serta fallback metadata.
- Golden test untuk Nilai Agama dan Moral, Fisik Motorik, Kognitif, Bahasa, Sosial Emosional, dan Seni.
- Uji indikator tunggal, data kosong, metadata tidak tersedia, pengukuran fisik, nilai campuran, dan perubahan assessment setelah generasi.
- Uji tenant isolation, batas akses guru wali kelas, status rapor tidak dapat diubah, dan audit event.
- Uji bahwa engine tidak mengubah assessment sumber, tidak menghasilkan klaim tanpa indikator, dan tidak mengandung frasa terlarang.
