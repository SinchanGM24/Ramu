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

    expect(content.content).toContain("mengenal suara hewan dan benda di sekitarnya telah berkembang sesuai harapan");
    expect(content.content).toContain("sedang mengembangkan kemampuan menyimak perkataan orang lain");
    expect(content.content).toContain("Untuk kemampuan mengulang kalimat sederhana");
    expect(content.content).not.toContain("BSH");
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
    expect(content.content).toContain("menunjukkan kemampuan yang sangat baik");
    expect(content.content).toContain("pada kegiatan yang melibatkan koordinasi dengan benda");
    expect(content.content).toContain("Melalui bermain yang melibatkan gerak tubuh");
    expect(content.content).not.toContain("serta kemampuan terkait lainnya");
  });
});
