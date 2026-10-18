import { describe, expect, it } from "vitest";
import {
  getUploadConcurrencyConfig,
  UploadConcurrencyLimiter,
} from "../src/common/upload-concurrency-limiter";

describe("UploadConcurrencyLimiter", () => {
  it("rejects excess simultaneous uploads for one school and releases capacity", async () => {
    const limiter = new UploadConcurrencyLimiter();
    const release: Array<() => void> = [];
    const pending = Array.from({ length: 3 }, () =>
      limiter.run(
        "school-1",
        () => new Promise<void>((resolve) => release.push(resolve)),
      ),
    );

    await Promise.resolve();
    await expect(
      limiter.run("school-1", async () => undefined),
    ).rejects.toThrow("Terlalu banyak unggahan");

    release.forEach((resolve) => resolve());
    await Promise.all(pending);
    await expect(
      limiter.run("school-1", async () => "available"),
    ).resolves.toBe("available");
  });

  it("uses safe bounded defaults from environment configuration", () => {
    expect(getUploadConcurrencyConfig({})).toEqual({
      globalLimit: 8,
      perSchoolLimit: 3,
    });
    expect(
      getUploadConcurrencyConfig({
        UPLOAD_CONCURRENCY_LIMIT: "0",
        UPLOAD_CONCURRENCY_PER_SCHOOL_LIMIT: "999",
      }),
    ).toEqual({ globalLimit: 1, perSchoolLimit: 1 });
  });
});
