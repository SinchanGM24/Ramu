import { describe, expect, it } from "vitest";
import { defaultTkIndicatorCount, defaultTkTemplate } from "../src/assessment/default-tk-template";

describe("default TK report template", () => {
  it("contains the complete 88-indicator hierarchy", () => {
    expect(defaultTkIndicatorCount).toBe(88);
    expect(defaultTkTemplate.map((area) => area.subAreas.flatMap((subArea) => subArea.indicators).length)).toEqual([6, 21, 17, 19, 13, 12]);
  });
});
