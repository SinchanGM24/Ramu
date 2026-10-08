import { describe, expect, it } from "vitest";
import { buildNarrativeDraft } from "../src/reports/narrative-generator";

describe("buildNarrativeDraft", () => {
  it("maps achievements, developing abilities, and practice needs into a natural parent-facing narrative", () => {
    const content = buildNarrativeDraft({
      studentId: "student", semesterId: "semester", areaId: "area", studentName: "Rizky",
      areaName: "Bahasa",
      assessments: [
        { indicatorId: "1", rating: "BSH", semanticGroup: "keaksaraan", narrativeLabel: "mengenal suara hewan dan benda di sekitarnya", description: "mengenal suara hewan dan benda di sekitarnya" },
        { indicatorId: "2", rating: "MB", semanticGroup: "memahami bahasa", narrativeLabel: "menyimak perkataan orang lain", description: "menyimak perkataan orang lain" },
        { indicatorId: "3", rating: "BB", semanticGroup: "mengungkapkan bahasa", narrativeLabel: "mengulang kalimat sederhana", description: "mengulang kalimat sederhana", recommendationTags: ["bahasa"] },
      ],
    });

    expect(content.content).toContain("telah mampu mengenal suara hewan dan benda di sekitarnya");
    expect(content.content).toContain("sedang mengembangkan kemampuan menyimak perkataan orang lain");
    expect(content.content).toContain("masih memerlukan kesempatan berlatih mengulang kalimat sederhana");
    expect(content).not.toContain("BSH");
  });

  it("keeps all-strong narratives encouraging and limits long indicator lists", () => {
    const content = buildNarrativeDraft({
      studentId: "student", semesterId: "semester", areaId: "area", studentName: "Alya",
      areaName: "Fisik Motorik",
      assessments: Array.from({ length: 6 }, (_, index) => ({ indicatorId: String(index), rating: "BSH" as const, semanticGroup: "motorik-halus", narrativeLabel: `kemampuan ${index + 1}`, description: `kemampuan ${index + 1}` })),
    });

    expect(content.content).toContain("Kegiatan yang serupa dapat terus diberikan");
    expect(content.content).not.toContain("kemampuan 6");
  });
});
