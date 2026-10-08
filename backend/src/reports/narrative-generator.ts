import { createHash } from "crypto";

export const SMART_NARRATIVE_ENGINE_VERSION = "1.4.0";
export type NarrativeRating = "BB" | "MB" | "BSH" | "BSB";
export type NarrativeAssessment = { indicatorId: string; rating: NarrativeRating; description: string; semanticGroup?: string | null; narrativeLabel?: string | null; observationType?: "SKILL" | "SAFETY" | "MEASUREMENT" | null; recommendationTags?: string[] | null; metadataVersion?: number | null };
export type NarrativeDraft = { content: string; signature: string; coveredIndicatorIds: string[]; omittedIndicatorIds: string[]; validationWarnings: string[] };

const recommendationCopy: Record<string, string> = {
  "motorik-kasar": "Berbagai permainan gerak seperti melompat, berlari, dan bermain bola",
  "motorik-halus": "Kegiatan menggambar, menjiplak, dan berkarya dengan beragam media",
  bahasa: "Kegiatan bercerita, bercakap-cakap, dan membaca bersama",
  kognitif: "Permainan mengelompokkan benda, menyusun pola, dan mencari cara sederhana",
  sosial: "Kegiatan bermain bersama yang menumbuhkan kemandirian, empati, dan kerja sama",
  seni: "Kegiatan bernyanyi, bergerak mengikuti irama, dan berkarya seni",
  agama: "Pembiasaan baik dan kegiatan ibadah yang sesuai tahap perkembangan anak",
  kesehatan: "Pembiasaan menjaga kebersihan dan kemandirian diri",
  keselamatan: "Percakapan dan permainan sederhana mengenai keselamatan di lingkungan sekitar",
};
const lowerFirst = (value: string) => value[0] && value[1]?.toLowerCase() === value[1] ? `${value[0].toLowerCase()}${value.slice(1)}` : value;
const joinNaturally = (items: string[]) => items.length < 2 ? items[0] ?? "" : items.length === 2 ? `${items[0]} dan ${items[1]}` : `${items.slice(0, -1).join(", ")}, dan ${items.at(-1)}`;
const displayName = (name: string, nickname?: string | null) => nickname?.trim() || name.trim().split(/\s+/)[0] || name;
const groupContext: Record<string, string> = {
  "agama-dan-moral": "pembiasaan nilai agama dan moral", "motorik-kasar": "kegiatan gerak tubuh", "koordinasi-objek": "kegiatan yang melibatkan koordinasi dengan benda", "motorik-halus": "kegiatan motorik halus", "kesehatan-dan-keselamatan": "pembiasaan kesehatan dan keselamatan",
  "kognitif-1": "kegiatan menemukan dan memecahkan masalah sederhana", "kognitif-2": "kegiatan berpikir logis", "kognitif-3": "kegiatan mengenal simbol dan bilangan",
  "bahasa-1": "kegiatan menyimak dan memahami bahasa", "bahasa-2": "kegiatan berbahasa dan bercakap-cakap", "bahasa-3": "kegiatan keaksaraan awal",
  "sosial-1": "kegiatan yang menumbuhkan kesadaran diri", "sosial-2": "kegiatan bersama yang menumbuhkan tanggung jawab", "sosial-3": "kegiatan bermain bersama", "seni-1": "kegiatan menikmati bunyi dan irama", "seni-2": "kegiatan berekspresi melalui seni",
};

function labels(items: NarrativeAssessment[], limit = 2) {
  const selected: NarrativeAssessment[] = [];
  const seenGroups = new Set<string>();
  for (const item of items) if (selected.length < limit && !seenGroups.has(item.semanticGroup ?? item.indicatorId)) { selected.push(item); seenGroups.add(item.semanticGroup ?? item.indicatorId); }
  for (const item of items) if (selected.length < limit && !selected.includes(item)) selected.push(item);
  return joinNaturally(selected.map((item) => lowerFirst(item.narrativeLabel || item.description)));
}

function contextFor(items: NarrativeAssessment[]) {
  const group = items[0]?.semanticGroup;
  return group && groupContext[group] ? groupContext[group] : "kegiatan pada aspek ini";
}

function topicFor(items: NarrativeAssessment[]) {
  const group = items[0]?.semanticGroup ?? "";
  if (["motorik-kasar", "koordinasi-objek"].includes(group)) return "gerak-tubuh";
  if (group.startsWith("kognitif-")) return "kognitif";
  if (group.startsWith("bahasa-")) return "bahasa";
  if (group.startsWith("sosial-")) return "sosial";
  if (group.startsWith("seni-")) return "seni";
  return group;
}

const topicLanguage: Record<string, { growth: string; support: string; reinforcement: string; recommendation: (activities: string, name: string) => string }> = {
  "gerak-tubuh": { growth: "melalui berbagai pengalaman bermain", support: "melalui pengalaman bermain yang menyenangkan", reinforcement: "Pengalaman bermain yang serupa", recommendation: (activities, name) => `${activities} dapat menjadi pilihan kegiatan yang menyenangkan bagi Ananda ${name}` },
  "motorik-halus": { growth: "melalui kegiatan mencoba dan berkarya", support: "melalui kegiatan mencoba dengan beragam media", reinforcement: "Kegiatan mencoba dan berkarya yang serupa", recommendation: (activities, name) => `${activities} dapat menjadi kesempatan yang menyenangkan bagi Ananda ${name}` },
  "agama-dan-moral": { growth: "melalui pembiasaan dan teladan sehari-hari", support: "melalui pembiasaan dan teladan yang dilakukan secara konsisten", reinforcement: "Pembiasaan baik yang serupa", recommendation: (activities, name) => `${activities} dapat menjadi pembiasaan yang dilakukan bersama Ananda ${name}` },
  bahasa: { growth: "melalui percakapan, cerita, dan kegiatan membaca", support: "melalui percakapan, cerita, dan pendampingan yang hangat", reinforcement: "Percakapan dan kegiatan membaca yang serupa", recommendation: (activities, name) => `${activities} dapat menjadi kesempatan untuk mendampingi Ananda ${name}` },
  kognitif: { growth: "melalui kesempatan mengamati, mencoba, dan menemukan", support: "melalui kesempatan mengamati, mencoba, dan menemukan", reinforcement: "Kesempatan mengamati dan mencoba yang serupa", recommendation: (activities, name) => `${activities} dapat menjadi kegiatan yang dapat dilakukan bersama Ananda ${name}` },
  sosial: { growth: "melalui interaksi bersama dan pendampingan yang hangat", support: "melalui kegiatan bersama dan pendampingan yang hangat", reinforcement: "Interaksi bersama yang serupa", recommendation: (activities, name) => `${activities} dapat menjadi kesempatan untuk menemani Ananda ${name}` },
  seni: { growth: "melalui pengalaman berekspresi dan berkarya", support: "melalui kesempatan berekspresi dengan beragam kegiatan seni", reinforcement: "Kegiatan berekspresi yang serupa", recommendation: (activities, name) => `${activities} dapat menjadi kegiatan yang menyenangkan bagi Ananda ${name}` },
  "kesehatan-dan-keselamatan": { growth: "melalui pembiasaan sehari-hari", support: "melalui pembiasaan dan pendampingan sehari-hari", reinforcement: "Pembiasaan yang serupa", recommendation: (activities, name) => `${activities} dapat menjadi bagian dari pendampingan Ananda ${name}` },
};

function languageFor(items: NarrativeAssessment[]) {
  return topicLanguage[topicFor(items)] ?? { growth: "melalui berbagai pengalaman sehari-hari", support: "melalui pendampingan yang hangat", reinforcement: "Pengalaman yang serupa", recommendation: (activities: string, name: string) => `${activities} dapat menjadi kesempatan yang baik bagi Ananda ${name}` };
}

function signature(input: { studentId: string; semesterId: string; areaId: string; assessments: NarrativeAssessment[] }) {
  const payload = input.assessments.map((item) => [item.indicatorId, item.rating, item.semanticGroup ?? "", item.narrativeLabel ?? "", item.observationType ?? "", [...(item.recommendationTags ?? [])].sort(), item.metadataVersion ?? 0] as const).sort((left, right) => left[0].localeCompare(right[0]));
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
  const veryStrong = byRating("BSB");
  const strong = byRating("BSH");
  const emerging = byRating("MB");
  const support = byRating("BB");
  const lines: string[] = [];
  if (veryStrong.length) lines.push(`Selama semester ini, Ananda ${name} menunjukkan perkembangan yang sangat baik dalam ${labels(veryStrong)}.`);
  if (strong.length) lines.push(`${veryStrong.length ? "Kemampuannya" : `Perkembangan Ananda ${name}`} dalam ${labels(strong)} juga telah berkembang sesuai harapan.`);
  if (!veryStrong.length && !strong.length) lines.push(`Pada aspek ${input.areaName.toLocaleLowerCase("id-ID")}, Ananda ${name} sedang menikmati proses bertumbuh ${languageFor(usable).growth}.`);
  if (emerging.length) lines.push(`${veryStrong.length || strong.length ? "Dalam" : "Pada"} ${contextFor(emerging)}, Ananda ${name} mulai menunjukkan kemampuan ${labels(emerging)}.`);
  if (support.length) {
    const followsEmergingTopic = emerging.length > 0 && topicFor(emerging) === topicFor(support);
    const supportLead = followsEmergingTopic ? "Adapun kemampuan" : `Pada ${contextFor(support)}, kemampuan`;
    lines.push(`${supportLead} ${labels(support)} masih membutuhkan dukungan dan pendampingan ${languageFor(support).support}.`);
    const tags = support.flatMap((item) => item.recommendationTags ?? []).filter((tag, index, all) => all.indexOf(tag) === index).map((tag) => recommendationCopy[tag]).filter(Boolean);
    if (tags.length) lines.push(`Untuk mendukung perkembangannya, ${languageFor(support).recommendation(lowerFirst(joinNaturally(tags.slice(0, 2))), name)}.`);
  }
  if (!emerging.length && !support.length && (veryStrong.length || strong.length)) lines.push(`${languageFor(veryStrong.length ? veryStrong : strong).reinforcement} dapat terus diberikan agar perkembangan Ananda ${name} semakin mantap.`);
  if (!usable.length) warnings.push("Tidak ada indikator keterampilan yang dapat dinarasikan pada area ini.");
  if (/(Pada kegiatan [^.]+\. Pada kegiatan)/.test(lines.join(" "))) warnings.push("Konteks kegiatan terulang; tinjau draf sebelum digunakan.");
  if (lines.some((line) => line.length > 330)) warnings.push("Salah satu kalimat cukup panjang; pertimbangkan menyederhanakan draf.");
  return { content: lines.join(" "), signature: signature(input), coveredIndicatorIds: usable.map((item) => item.indicatorId), omittedIndicatorIds: omitted.map((item) => item.indicatorId), validationWarnings: warnings };
}
