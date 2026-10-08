import { describe, expect, it } from "vitest";
import { defaultTkIndicatorCount, defaultTkTemplate } from "../src/assessment/default-tk-template";
import { defaultTkNarrativeMetadata } from "../src/assessment/default-tk-narrative-metadata";

describe("default TK narrative metadata", () => {
  it("covers every indicator in the default template", () => {
    const paths = defaultTkTemplate.flatMap((area, areaIndex) => area.subAreas.flatMap((subArea, subAreaIndex) => subArea.indicators.map((description, indicatorIndex) => ({ areaPosition: areaIndex + 1, subAreaPosition: subAreaIndex + 1, indicatorPosition: indicatorIndex + 1, description }))));
    expect(paths).toHaveLength(defaultTkIndicatorCount);
    expect(paths.every((path) => defaultTkNarrativeMetadata(path).narrativeLabel.length > 0)).toBe(true);
  });

  it("uses curated groups for motor skills and omits physical measurements", () => {
    expect(defaultTkNarrativeMetadata({ areaPosition: 2, subAreaPosition: 1, indicatorPosition: 4, description: "Melempar sesuatu secara terarah" })).toMatchObject({ semanticGroup: "koordinasi-objek", recommendationTags: ["motorik-kasar"] });
    expect(defaultTkNarrativeMetadata({ areaPosition: 2, subAreaPosition: 3, indicatorPosition: 1, description: "Berat badan sesuai tingkat usia" })).toMatchObject({ observationType: "MEASUREMENT" });
    expect(defaultTkNarrativeMetadata({ areaPosition: 4, subAreaPosition: 2, indicatorPosition: 1, description: "Mengulang kalimat sederhana" })).toMatchObject({ semanticGroup: "bahasa-2", recommendationTags: ["bahasa"] });
  });
});
