import { describe, expect, it } from "vitest";
import { HealthController } from "../src/health/health.controller";

describe("HealthController", () => {
  it("returns ready only after database and object storage are available", async () => {
    const controller = new HealthController(
      { query: async () => undefined } as never,
      { assertStorageReady: async () => undefined } as never,
    );

    await expect(controller.readiness()).resolves.toEqual({ status: "ready" });
  });

  it("does not report ready when object storage is unavailable", async () => {
    const controller = new HealthController(
      { query: async () => undefined } as never,
      {
        assertStorageReady: async () => {
          throw new Error("unavailable");
        },
      } as never,
    );

    await expect(controller.readiness()).rejects.toThrow("belum siap");
  });
});
