import { describe, expect, it } from "vitest";
import { buildNarrativeDraft } from "../src/reports/narrative-generator";

describe("buildNarrativeDraft", () => {
  it("maps achievements, developing abilities, and practice needs into a natural parent-facing narrative", () => {
    const content = buildNarrativeDraft({
      studentId: "student", semesterId: "semester", areaId: "area", studentName: "Rizky",
      areaName: "Bahasa",
      assessments: [
        { indicatorId: "1", rating: "BSH", semanticGroup: "bahasa-3", narrativeLabel: "mengenal suara hewan dan benda di sekitarnya", description: "mengenal suara hewan dan benda di sekitarnya" },
        { indicatorId: "2", rating: "MB", semanticGroup: "bahasa-1", narrativeLabel: "menyimak perkataan orang lain", description: "menyimak perkataan orang lain" },
        { indicatorId: "3", rating: "BB", semanticGroup: "bahasa-2", narrativeLabel: "mengulang kalimat sederhana", description: "mengulang kalimat sederhana", recommendationTags: ["bahasa"] },
      ],
    });

    expect(content.content).toContain("mengenal suara hewan dan benda di sekitarnya juga telah berkembang sesuai harapan");
    expect(content.content).toContain("mulai menunjukkan kemampuan menyimak perkataan orang lain");
    expect(content.content).toContain("masih membutuhkan dukungan dan pendampingan melalui percakapan, cerita, dan pendampingan yang hangat");
    expect(content.content).not.toContain("BSH");
  });

  it("keeps all-strong narratives encouraging and limits long indicator lists", () => {
    const content = buildNarrativeDraft({
      studentId: "student", semesterId: "semester", areaId: "area", studentName: "Alya",
      areaName: "Fisik Motorik",
      assessments: Array.from({ length: 6 }, (_, index) => ({ indicatorId: String(index), rating: "BSH" as const, semanticGroup: "motorik-halus", narrativeLabel: `kemampuan ${index + 1}`, description: `kemampuan ${index + 1}` })),
    });

    expect(content.content).toContain("Kegiatan mencoba dan berkarya yang serupa dapat terus diberikan");
    expect(content.content).not.toContain("kemampuan 6");
  });

  it("uses semantic context and a supportive recommendation rather than a long mixed list", () => {
    const content = buildNarrativeDraft({
      studentId: "student", semesterId: "semester", areaId: "area", studentName: "Alya Putri", areaName: "Fisik Motorik",
      assessments: [
        { indicatorId: "1", rating: "BSB", semanticGroup: "motorik-halus", narrativeLabel: "membuat berbagai bentuk garis dan lingkaran", description: "x" },
        { indicatorId: "2", rating: "BSH", semanticGroup: "motorik-halus", narrativeLabel: "menjiplak bentuk sederhana", description: "x" },
        { indicatorId: "3", rating: "MB", semanticGroup: "koordinasi-objek", narrativeLabel: "melempar benda ke arah tujuan", description: "x" },
        { indicatorId: "4", rating: "BB", semanticGroup: "motorik-kasar", narrativeLabel: "melompat, meloncat, dan berlari secara terkoordinasi", description: "x", recommendationTags: ["motorik-kasar"] },
      ],
    });
    expect(content.content).toContain("menunjukkan perkembangan yang sangat baik");
    expect(content.content).toContain("Dalam kegiatan yang melibatkan koordinasi dengan benda");
    expect(content.content).toContain("Adapun kemampuan melompat, meloncat, dan berlari secara terkoordinasi masih membutuhkan dukungan dan pendampingan");
    expect(content.content).not.toContain("Pada kegiatan gerak tubuh");
    expect(content.content).toContain("berbagai permainan gerak seperti melompat, berlari, dan bermain bola");
    expect(content.content).not.toContain("serta kemampuan terkait lainnya");
  });

  it.each([
    ["Nilai-Nilai Agama dan Moral", "agama-dan-moral", "mengucapkan salam dan membalas salam", "agama"],
    ["Kognitif", "kognitif-2", "mengenal pola sederhana", "kognitif"],
    ["Bahasa", "bahasa-2", "menyampaikan pendapat sederhana", "bahasa"],
    ["Sosial Emosional", "sosial-3", "menunjukkan rasa empati", "sosial"],
    ["Seni", "seni-2", "mengekspresikan diri melalui karya seni", "seni"],
  ])("keeps a warm, child-centred tone for %s", (areaName, semanticGroup, narrativeLabel, recommendationTag) => {
    const content = buildNarrativeDraft({
      studentId: "student", semesterId: "semester", areaId: "area", studentName: "Naya Putri", areaName,
      assessments: [{ indicatorId: "1", rating: "BB", semanticGroup, narrativeLabel, description: narrativeLabel, recommendationTags: [recommendationTag] }],
    });
    expect(content.content).toContain("Ananda Naya");
    const expectedSupport: Record<string, string> = { "agama-dan-moral": "pembiasaan dan teladan", "kognitif-2": "kesempatan mengamati", "bahasa-2": "percakapan, cerita", "sosial-3": "kegiatan bersama", "seni-2": "kesempatan berekspresi" };
    expect(content.content).toContain(expectedSupport[semanticGroup]);
    if (["agama-dan-moral", "bahasa-2"].includes(semanticGroup)) expect(content.content).not.toContain("pengalaman bermain");
    expect(content.content).not.toMatch(/perlu berlatih|meningkatkan keterampilan|belum optimal|harus menguasai/i);
  });

  it("changes its traceability signature when narrative metadata changes", () => {
    const base = { studentId: "student", semesterId: "semester", areaId: "area", studentName: "Alya", areaName: "Bahasa", assessments: [{ indicatorId: "1", rating: "MB" as const, semanticGroup: "bahasa-1", narrativeLabel: "menyimak cerita", description: "menyimak cerita", recommendationTags: ["bahasa"], metadataVersion: 2 }] };
    const renamed = { ...base, assessments: [{ ...base.assessments[0], narrativeLabel: "memahami cerita yang dibacakan" }] };
    expect(buildNarrativeDraft(base).signature).not.toBe(buildNarrativeDraft(renamed).signature);
  });

  it.each([
    ["Nilai-Nilai Agama dan Moral", "agama-dan-moral", "mengucapkan salam", "agama"],
    ["Fisik Motorik", "motorik-kasar", "melompat dan berlari", "motorik-kasar"],
    ["Kognitif", "kognitif-1", "mengenal benda berdasarkan fungsi", "kognitif"],
    ["Bahasa", "bahasa-1", "memahami cerita yang dibacakan", "bahasa"],
    ["Sosial Emosional", "sosial-3", "menunjukkan rasa empati", "sosial"],
    ["Seni", "seni-2", "bernyanyi sendiri", "seni"],
  ])("creates a complete, parent-facing paragraph for %s", (areaName, semanticGroup, label, tag) => {
    const draft = buildNarrativeDraft({ studentId: "student", semesterId: "semester", areaId: "area", studentName: "Alya Putri", areaName, assessments: [
      { indicatorId: "1", rating: "BSH", semanticGroup, narrativeLabel: label, description: label, recommendationTags: [tag] },
      { indicatorId: "2", rating: "MB", semanticGroup, narrativeLabel: `mulai ${label}`, description: label, recommendationTags: [tag] },
      { indicatorId: "3", rating: "BB", semanticGroup, narrativeLabel: `mencoba ${label}`, description: label, recommendationTags: [tag] },
    ] });
    expect(draft.content).toContain("Ananda Alya");
    expect(draft.content).not.toMatch(/\bBB\b|\bMB\b|\bBSH\b|\bBSB\b/);
    expect(draft.validationWarnings).not.toContain("Konteks kegiatan terulang; tinjau draf sebelum digunakan.");
  });
});
