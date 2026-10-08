import { describe, expect, it } from "vitest";
import { buildNarrativeDraft } from "../src/reports/narrative-generator";

describe("buildNarrativeDraft", () => {
  it("maps achievements, developing abilities, and practice needs into a natural parent-facing narrative", () => {
    const content = buildNarrativeDraft({
      studentName: "Rizky",
      areaName: "Bahasa",
      assessments: [
        { code: "BSH", description: "mengenal suara hewan dan benda di sekitarnya" },
        { code: "MB", description: "menyimak perkataan orang lain" },
        { code: "BB", description: "mengulang kalimat sederhana" },
      ],
    });

    expect(content).toContain("telah mampu mengenal suara hewan dan benda di sekitarnya");
    expect(content).toContain("mulai berkembang dalam menyimak perkataan orang lain");
    expect(content).toContain("perlu dibiasakan untuk mengulang kalimat sederhana");
    expect(content).not.toContain("BSH");
  });

  it("keeps all-strong narratives encouraging and limits long indicator lists", () => {
    const content = buildNarrativeDraft({
      studentName: "Alya",
      areaName: "Fisik Motorik",
      assessments: Array.from({ length: 6 }, (_, index) => ({ code: "BSH", description: `kemampuan ${index + 1}` })),
    });

    expect(content).toContain("Kegiatan serupa dapat terus diberikan");
    expect(content).toContain("kemampuan terkait lainnya");
    expect(content).not.toContain("kemampuan 6");
  });
});
