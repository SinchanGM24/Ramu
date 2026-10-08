type IndicatorPath = { areaPosition: number; subAreaPosition: number; indicatorPosition: number; description: string };
type Metadata = { semanticGroup: string; competencyConcept: string; narrativeLabel: string; observationType: "SKILL" | "SAFETY" | "MEASUREMENT"; recommendationTags: string[] };

export const DEFAULT_TK_NARRATIVE_METADATA_VERSION = 3;

const lowerFirst = (value: string) => value[0] && value[1]?.toLowerCase() === value[1] ? `${value[0].toLowerCase()}${value.slice(1)}` : value;
const curatedLabels: Record<string, string[]> = {
  "1.1": ["mengenal agama yang dianut", "menirukan gerakan ibadah secara berurutan", "mengucapkan doa dalam kegiatan sehari-hari", "mengenali perilaku baik dan kurang baik", "membiasakan perilaku baik", "mengucapkan dan membalas salam"],
  "3.1": ["mengenal fungsi benda di sekitarnya", "menggunakan benda dalam permainan simbolik", "mengenal konsep sederhana sehari-hari", "memahami konsep banyak dan sedikit", "menciptakan gagasan sederhana", "mengamati benda dan gejala dengan rasa ingin tahu", "mengenal pola kegiatan dan waktu", "memahami posisi dalam keluarga dan lingkungan"],
  "3.2": ["mengelompokkan benda berdasarkan cirinya", "mengenali hubungan sebab dan akibat", "mengelompokkan benda yang sejenis atau berpasangan", "mengenali dan mengulang pola", "mengurutkan benda berdasarkan ukuran atau warna"],
  "3.3": ["membilang benda satu sampai sepuluh", "mengenal konsep bilangan", "mengenal lambang bilangan", "mengenal lambang huruf"],
  "4.1": ["menyimak perkataan orang lain", "memahami dua arahan sederhana", "memahami cerita yang dibacakan", "mengenal kata sifat", "membedakan bunyi-bunyian bahasa"],
  "4.2": ["mengulang kalimat sederhana", "bertanya dengan kalimat yang tepat", "menjawab pertanyaan sesuai konteks", "mengungkapkan perasaan dengan kata sifat", "menyebutkan kata yang dikenal", "menyampaikan pendapat", "menyatakan alasan atas keinginan atau ketidaksetujuan", "menceritakan kembali cerita yang didengar", "menambah perbendaharaan kata", "berpartisipasi dalam percakapan"],
  "4.3": ["mengenal berbagai simbol", "mengenal bunyi hewan dan benda di sekitar", "membuat coretan yang bermakna", "meniru huruf A-Z"],
  "5.1": ["memilih kegiatan secara mandiri", "mengendalikan perasaan", "menunjukkan rasa percaya diri", "memahami aturan dan disiplin", "menunjukkan sikap gigih", "menghargai hasil karya sendiri"],
  "5.2": ["menjaga diri di lingkungan sekitar", "menghargai keunggulan orang lain", "berbagi, menolong, dan membantu teman"],
  "5.3": ["antusias dalam permainan kompetitif yang positif", "menaati aturan permainan", "menghargai orang lain", "menunjukkan rasa empati"],
  "6.1": ["menikmati musik atau lagu kesukaannya", "membuat irama dengan alat musik atau benda"],
  "6.2": ["memilih lagu yang disukai", "bernyanyi secara mandiri", "menggunakan imajinasi dalam bermain peran", "membedakan fantasi dan kenyataan", "bercerita menggunakan dialog dan berbagai bahan", "mengekspresikan gerak mengikuti irama", "menggambar objek di sekitar", "membentuk karya dari objek yang diamati", "mengungkapkan sesuatu dengan ekspresif", "memadukan warna dalam gambar atau karya"],
};

export function defaultTkNarrativeMetadata(path: IndicatorPath): Metadata {
  const base = { semanticGroup: `${path.areaPosition}.${path.subAreaPosition}`, competencyConcept: "kemampuan perkembangan", narrativeLabel: lowerFirst(path.description), observationType: "SKILL" as const, recommendationTags: ["kognitif"] };
  const label = curatedLabels[`${path.areaPosition}.${path.subAreaPosition}`]?.[path.indicatorPosition - 1] ?? base.narrativeLabel;
  if (path.areaPosition === 1) return { ...base, narrativeLabel: label, semanticGroup: "agama-dan-moral", competencyConcept: "pembiasaan nilai agama dan moral", recommendationTags: ["agama"] };
  if (path.areaPosition === 2 && path.subAreaPosition === 1) {
    const labels = ["menirukan beragam gerakan", "bergelayut", "melompat, meloncat, dan berlari secara terkoordinasi", "melempar benda ke arah tujuan", "menangkap benda dengan tepat", "mengantisipasi gerakan", "menendang benda ke arah tujuan", "memanfaatkan alat permainan luar ruang"];
    const group = path.indicatorPosition >= 4 && path.indicatorPosition <= 7 ? "koordinasi-objek" : "motorik-kasar";
    return { ...base, semanticGroup: group, competencyConcept: group === "koordinasi-objek" ? "koordinasi gerak dengan objek" : "gerak tubuh", narrativeLabel: labels[path.indicatorPosition - 1], recommendationTags: ["motorik-kasar"] };
  }
  if (path.areaPosition === 2 && path.subAreaPosition === 2) {
    const labels = ["membuat berbagai bentuk garis dan lingkaran", "menjiplak bentuk sederhana", "mengoordinasikan mata dan tangan", "membentuk karya dengan berbagai media", "mengekspresikan diri melalui karya seni", "mengontrol gerakan tangan"];
    return { ...base, semanticGroup: "motorik-halus", competencyConcept: "koordinasi mata dan tangan", narrativeLabel: labels[path.indicatorPosition - 1], recommendationTags: ["motorik-halus"] };
  }
  if (path.areaPosition === 2 && path.subAreaPosition === 3) {
    if (path.indicatorPosition <= 4) return { ...base, semanticGroup: "pertumbuhan-fisik", competencyConcept: "data pertumbuhan fisik", observationType: "MEASUREMENT", recommendationTags: [] };
    const recommendationTags = path.indicatorPosition === 5 ? ["kesehatan"] : ["keselamatan"];
    return { ...base, semanticGroup: "kesehatan-dan-keselamatan", competencyConcept: "pembiasaan kesehatan dan keselamatan", observationType: path.indicatorPosition === 5 ? "SKILL" : "SAFETY", recommendationTags };
  }
  if (path.areaPosition === 3) return { ...base, narrativeLabel: label, semanticGroup: `kognitif-${path.subAreaPosition}`, competencyConcept: "kemampuan berpikir", recommendationTags: ["kognitif"] };
  if (path.areaPosition === 4) return { ...base, narrativeLabel: label, semanticGroup: `bahasa-${path.subAreaPosition}`, competencyConcept: "kemampuan berbahasa", recommendationTags: ["bahasa"] };
  if (path.areaPosition === 5) return { ...base, narrativeLabel: label, semanticGroup: `sosial-${path.subAreaPosition}`, competencyConcept: "kemampuan sosial emosional", recommendationTags: ["sosial"] };
  if (path.areaPosition === 6) return { ...base, narrativeLabel: label, semanticGroup: `seni-${path.subAreaPosition}`, competencyConcept: "ekspresi seni", recommendationTags: ["seni"] };
  return base;
}
