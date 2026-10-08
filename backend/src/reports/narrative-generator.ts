export type NarrativeAssessment = { code: string; description: string };

const scaleCopy: Record<string, string> = {
  BB: "belum berkembang",
  MB: "mulai berkembang",
  BSH: "berkembang sesuai harapan",
  BSB: "berkembang sangat baik",
};
const scaleOrder = ["BB", "MB", "BSH", "BSB"];
const maxExamplesPerGroup = 5;

function joinNaturally(items: string[]) {
  if (items.length < 2) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} dan ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, dan ${items.at(-1)}`;
}

function examples(items: string[]) {
  const selected = items.slice(0, maxExamplesPerGroup).map((item) => item[0] && item[1]?.toLowerCase() === item[1] ? `${item[0].toLowerCase()}${item.slice(1)}` : item);
  const list = joinNaturally(selected);
  return items.length > maxExamplesPerGroup ? `${list}, serta kemampuan terkait lainnya` : list;
}

export function buildNarrativeDraft({ studentName, areaName, assessments }: { studentName: string; areaName: string; assessments: NarrativeAssessment[] }) {
  const byScale = new Map<string, string[]>();
  for (const assessment of assessments) byScale.set(assessment.code, [...(byScale.get(assessment.code) ?? []), assessment.description]);

  const summary = joinNaturally(scaleOrder.filter((code) => byScale.has(code)).map((code) => scaleCopy[code]));
  const sentences = [`Tingkat pencapaian perkembangan Ananda ${studentName} pada aspek ${areaName} menunjukkan kemampuan yang ${summary}.`];
  const bsb = byScale.get("BSB");
  const bsh = byScale.get("BSH");
  const mb = byScale.get("MB");
  const bb = byScale.get("BB");

  if (bsb?.length) sentences.push(`Ananda ${studentName} menunjukkan perkembangan sangat baik dalam ${examples(bsb)}.`);
  if (bsh?.length) sentences.push(`Ananda ${studentName} telah mampu ${examples(bsh)}.`);
  if (mb?.length) sentences.push(`Ananda ${studentName} mulai berkembang dalam ${examples(mb)}.`);
  if (bb?.length) sentences.push(`Ananda ${studentName} perlu dibiasakan untuk ${examples(bb)}.`);
  if (!mb?.length && !bb?.length) sentences.push("Kegiatan serupa dapat terus diberikan agar kemampuan Ananda semakin mantap.");

  return sentences.join(" ");
}
