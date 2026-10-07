export type DefaultTkArea = { name: string; subAreas: Array<{ name: string; indicators: string[] }> };

export const DEFAULT_TK_TEMPLATE_NAME = "DEFAULT_TK_REPORT_TEMPLATE";

export const defaultTkTemplate: DefaultTkArea[] = [
  { name: "Nilai-Nilai Agama dan Moral", subAreas: [{ name: "Nilai-Nilai Agama dan Moral", indicators: ["Mengetahui agama yang dianutnya", "Meniru gerakan beribadah dengan urutan yang benar", "Mengucapkan doa sebelum dan/atau sesudah melakukan sesuatu", "Mengenal perilaku baik/sopan dan buruk", "Membiasakan diri berperilaku baik", "Mengucapkan salam dan membalas salam"] }] },
  { name: "Fisik Motorik", subAreas: [
    { name: "Motorik Kasar", indicators: ["Menirukan gerakan binatang, pohon tertiup angin, pesawat terbang, dan sebagainya", "Melakukan gerakan menggantung (bergelayut)", "Melakukan gerakan melompat, meloncat, dan berlari secara terkoordinasi", "Melempar sesuatu secara terarah", "Menangkap sesuatu secara tepat", "Melakukan gerakan antisipasi", "Menendang sesuatu secara terarah", "Memanfaatkan alat permainan di luar kelas"] },
    { name: "Motorik Halus", indicators: ["Membuat garis vertikal, horizontal, lengkung kiri/kanan, miring kiri/kanan, dan lingkaran", "Menjiplak bentuk", "Mengkoordinasikan mata dan tangan untuk melakukan gerakan yang rumit", "Melakukan gerakan manipulatif untuk menghasilkan suatu bentuk dengan menggunakan berbagai media", "Mengekspresikan diri dengan berkarya seni menggunakan berbagai media", "Mengontrol gerakan tangan yang menggunakan otot halus"] },
    { name: "Kesehatan dan Perilaku Keselamatan", indicators: ["Berat badan sesuai tingkat usia", "Tinggi badan sesuai tingkat usia", "Berat badan sesuai dengan standar tinggi badan", "Lingkar kepala sesuai tingkat usia", "Menggunakan toilet dengan bantuan minimal", "Memahami berbagai alarm bahaya", "Mengenal rambu lalu lintas yang ada di jalan"] },
  ] },
  { name: "Kognitif", subAreas: [
    { name: "Belajar dan Pemecahan Masalah", indicators: ["Mengenal benda berdasarkan fungsi", "Menggunakan benda-benda sebagai permainan simbolik", "Mengenal konsep sederhana dalam kehidupan sehari-hari", "Mengetahui konsep banyak dan sedikit", "Mengkreasikan sesuatu sesuai dengan idenya sendiri yang terkait dengan berbagai pemecahan masalah", "Mengamati benda dan gejala dengan rasa ingin tahu", "Mengenal pola kegiatan dan menyadari pentingnya waktu", "Memahami posisi atau kedudukan dalam keluarga, ruang, dan lingkungan sosial"] },
    { name: "Berpikir Logis", indicators: ["Mengklasifikasikan benda berdasarkan fungsi, bentuk, warna, atau ukuran", "Mengenal gejala sebab-akibat yang terkait dengan dirinya", "Mengklasifikasikan benda ke dalam kelompok yang sama, sejenis, atau berpasangan dengan dua variasi", "Mengenal pola dan mengulanginya", "Mengurutkan benda berdasarkan lima seriasi ukuran atau warna"] },
    { name: "Berpikir Simbolik", indicators: ["Membilang banyak benda satu sampai sepuluh", "Mengenal konsep bilangan", "Mengenal lambang bilangan", "Mengenal lambang huruf"] },
  ] },
  { name: "Bahasa", subAreas: [
    { name: "Memahami Bahasa", indicators: ["Menyimak perkataan orang lain", "Mengerti dua perintah yang diberikan bersamaan", "Memahami cerita yang dibacakan", "Mengenal perbendaharaan kata mengenai kata sifat", "Mendengar dan membedakan bunyi-bunyian dalam Bahasa Indonesia"] },
    { name: "Mengungkapkan Bahasa", indicators: ["Mengulang kalimat sederhana", "Bertanya dengan kalimat yang benar", "Menjawab pertanyaan sesuai pertanyaan", "Mengungkapkan perasaan dengan kata sifat", "Menyebutkan kata-kata yang dikenal", "Mengutarakan pendapat kepada orang lain", "Menyatakan alasan terhadap sesuatu yang diinginkan atau ketidaksetujuan", "Menceritakan kembali cerita atau dongeng yang pernah didengar", "Memperkaya perbendaharaan kata", "Berpartisipasi dalam percakapan"] },
    { name: "Keaksaraan", indicators: ["Mengenal simbol-simbol", "Mengenal suara-suara hewan atau benda yang ada di sekitarnya", "Membuat coretan yang bermakna", "Meniru huruf A-Z"] },
  ] },
  { name: "Sosial Emosional", subAreas: [
    { name: "Kesadaran Diri", indicators: ["Menunjukkan sikap mandiri dalam memilih kegiatan", "Mengendalikan perasaan", "Menunjukkan rasa percaya diri", "Memahami peraturan dan disiplin", "Memiliki sikap gigih", "Bangga terhadap hasil karya sendiri"] },
    { name: "Tanggungjawab Diri dan Orang Lain", indicators: ["Menjaga diri sendiri dari lingkungannya", "Menghargai keunggulan orang lain", "Mau berbagi, menolong, dan membantu teman"] },
    { name: "Perilaku Prososial", indicators: ["Menunjukkan antusiasme dalam melakukan permainan kompetitif secara positif", "Menaati aturan yang berlaku dalam suatu permainan", "Menghargai orang lain", "Menunjukkan rasa empati"] },
  ] },
  { name: "Seni", subAreas: [
    { name: "Menikmati Lagu dan Suara", indicators: ["Senang mendengarkan berbagai macam musik atau lagu kesukaannya", "Memainkan alat musik, instrumen, atau benda yang dapat membentuk irama teratur"] },
    { name: "Tertarik dengan Kegiatan Seni", indicators: ["Memilih jenis lagu yang disukai", "Bernyanyi sendiri", "Menggunakan imajinasi untuk mencerminkan perasaan dalam sebuah peran", "Membedakan peran fantasi dan kenyataan", "Menggunakan dialog, perilaku, dan berbagai materi dalam menceritakan suatu cerita", "Mengekspresikan gerakan dengan irama yang bervariasi", "Menggambar objek di sekitarnya", "Membentuk berdasarkan objek yang dilihatnya", "Mendeskripsikan sesuatu dengan ekspresif yang berirama", "Mengkombinasikan berbagai warna ketika menggambar atau mewarnai"] },
  ] },
];

export const defaultTkIndicatorCount = defaultTkTemplate.flatMap((area) => area.subAreas).reduce((total, subArea) => total + subArea.indicators.length, 0);
