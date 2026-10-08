type IndicatorPath = { areaPosition: number; subAreaPosition: number; indicatorPosition: number; description: string };
type Metadata = { semanticGroup: string; competencyConcept: string; narrativeLabel: string; observationType: "SKILL" | "SAFETY" | "MEASUREMENT"; recommendationTags: string[] };

const lowerFirst = (value: string) => value[0] && value[1]?.toLowerCase() === value[1] ? `${value[0].toLowerCase()}${value.slice(1)}` : value;

export function defaultTkNarrativeMetadata(path: IndicatorPath): Metadata {
  const base = { semanticGroup: `${path.areaPosition}.${path.subAreaPosition}`, competencyConcept: "kemampuan perkembangan", narrativeLabel: lowerFirst(path.description), observationType: "SKILL" as const, recommendationTags: ["kognitif"] };
  if (path.areaPosition === 1) return { ...base, semanticGroup: "agama-dan-moral", competencyConcept: "pembiasaan nilai agama dan moral", recommendationTags: ["agama"] };
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
  if (path.areaPosition === 3) return { ...base, semanticGroup: `kognitif-${path.subAreaPosition}`, competencyConcept: "kemampuan berpikir", recommendationTags: ["kognitif"] };
  if (path.areaPosition === 4) return { ...base, semanticGroup: `bahasa-${path.subAreaPosition}`, competencyConcept: "kemampuan berbahasa", recommendationTags: ["bahasa"] };
  if (path.areaPosition === 5) return { ...base, semanticGroup: `sosial-${path.subAreaPosition}`, competencyConcept: "kemampuan sosial emosional", recommendationTags: ["sosial"] };
  if (path.areaPosition === 6) return { ...base, semanticGroup: `seni-${path.subAreaPosition}`, competencyConcept: "ekspresi seni", recommendationTags: ["seni"] };
  return base;
}
