import { createHash } from "crypto";

export const SMART_NARRATIVE_ENGINE_VERSION = "1.0.0";
export type NarrativeRating = "BB" | "MB" | "BSH" | "BSB";
export type NarrativeAssessment = { indicatorId: string; rating: NarrativeRating; description: string; semanticGroup?: string | null; narrativeLabel?: string | null; observationType?: "SKILL" | "SAFETY" | "MEASUREMENT" | null; recommendationTags?: string[] | null; metadataVersion?: number | null };
export type NarrativeDraft = { content: string; signature: string; coveredIndicatorIds: string[]; omittedIndicatorIds: string[]; validationWarnings: string[] };

const recommendationCopy: Record<string, string> = { "motorik-kasar": "bermain yang melibatkan gerak tubuh seperti melompat, berlari, dan permainan bola", "motorik-halus": "kegiatan menggambar, menjiplak, dan berkarya menggunakan beragam media", bahasa: "kegiatan bercerita, percakapan, dan membaca bersama", kognitif: "permainan mengelompokkan, menyusun pola, dan memecahkan masalah sederhana", sosial: "kegiatan bermain bersama yang melatih kemandirian, empati, dan kerja sama", seni: "kegiatan bernyanyi, bergerak mengikuti irama, dan berkarya seni", agama: "pembiasaan baik dan kegiatan ibadah sesuai tahap perkembangan anak" };
const lowerFirst = (value: string) => value[0] && value[1]?.toLowerCase() === value[1] ? `${value[0].toLowerCase()}${value.slice(1)}` : value;
const joinNaturally = (items: string[]) => items.length < 2 ? items[0] ?? "" : items.length === 2 ? `${items[0]} dan ${items[1]}` : `${items.slice(0, -1).join(", ")}, dan ${items.at(-1)}`;
const displayName = (name: string, nickname?: string | null) => nickname?.trim() || name.trim().split(/\s+/)[0] || name;

function signature(input: { studentId: string; semesterId: string; areaId: string; assessments: NarrativeAssessment[] }) {
  const payload = input.assessments.map((item) => [item.indicatorId, item.rating, item.metadataVersion ?? 0] as const).sort((left, right) => left[0].localeCompare(right[0]));
  return createHash("sha256").update(JSON.stringify([SMART_NARRATIVE_ENGINE_VERSION, input.studentId, input.semesterId, input.areaId, payload])).digest("hex");
}

export function buildNarrativeDraft(input: { studentId: string; semesterId: string; areaId: string; studentName: string; nickname?: string | null; areaName: string; assessments: NarrativeAssessment[] }): NarrativeDraft {
  const warnings: string[] = [];
  const omitted = input.assessments.filter((item) => item.observationType === "MEASUREMENT");
  const usable = input.assessments.filter((item) => item.observationType !== "MEASUREMENT");
  if (omitted.length) warnings.push("Indikator pengukuran fisik tidak ditafsirkan oleh generator dan tetap tersedia pada data akhir semester.");
  const missingMetadata = usable.filter((item) => !item.semanticGroup || !item.narrativeLabel);
  if (missingMetadata.length) warnings.push("Sebagian indikator belum memiliki metadata narasi; draf menggunakan label indikator sebagai fallback.");
  const name = displayName(input.studentName, input.nickname);
  const byRating = (rating: NarrativeRating) => usable.filter((item) => item.rating === rating);
  const phrase = (items: NarrativeAssessment[]) => joinNaturally(items.slice(0, 3).map((item) => lowerFirst(item.narrativeLabel || item.description)));
  const strong = [...byRating("BSB"), ...byRating("BSH")];
  const emerging = byRating("MB");
  const support = byRating("BB");
  const lines: string[] = [];
  if (strong.length) lines.push(`Selama semester ini, Ananda ${name} menunjukkan capaian positif pada aspek ${input.areaName.toLocaleLowerCase("id-ID")}. Ananda ${name} telah mampu ${phrase(strong)}.`);
  else lines.push(`Pada aspek ${input.areaName.toLocaleLowerCase("id-ID")}, Ananda ${name} sedang bertumbuh melalui berbagai kesempatan belajar.`);
  if (emerging.length) lines.push(`Sementara itu, Ananda ${name} sedang mengembangkan kemampuan ${phrase(emerging)}.`);
  if (support.length) {
    lines.push(`Ananda ${name} masih memerlukan kesempatan berlatih ${phrase(support)}.`);
    const tags = support.flatMap((item) => item.recommendationTags ?? []).filter((tag, index, all) => all.indexOf(tag) === index).map((tag) => recommendationCopy[tag]).filter(Boolean);
    if (tags.length) lines.push(`Ke depannya, Ananda ${name} dapat memperoleh stimulasi melalui ${joinNaturally(tags.slice(0, 2))}.`);
  }
  if (!emerging.length && !support.length && strong.length) lines.push(`Kegiatan yang serupa dapat terus diberikan agar kemampuan Ananda ${name} semakin mantap.`);
  if (!usable.length) warnings.push("Tidak ada indikator keterampilan yang dapat dinarasikan pada area ini.");
  return { content: lines.join(" "), signature: signature(input), coveredIndicatorIds: usable.map((item) => item.indicatorId), omittedIndicatorIds: omitted.map((item) => item.indicatorId), validationWarnings: warnings };
}
