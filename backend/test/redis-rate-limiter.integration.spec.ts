import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { RequestRateLimiter } from "../src/common/request-rate-limiter";

const runIntegration = process.env.REDIS_RATE_LIMIT_INTEGRATION_TEST === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration("Redis request rate limiter", () => {
  it("shares one atomic limit across two API instances", async () => {
    const environment = {
      RATE_LIMIT_REDIS_URL:
        process.env.RATE_LIMIT_REDIS_URL || "redis://localhost:6380",
    };
    const firstInstance = new RequestRateLimiter(environment);
    const secondInstance = new RequestRateLimiter(environment);
    const rule = {
      key: `integration:${randomUUID()}`,
      limit: 2,
      windowMs: 60_000,
    };

    await firstInstance.onModuleInit();
    await secondInstance.onModuleInit();
    try {
      expect(await firstInstance.consume(rule)).toMatchObject({
        allowed: true,
      });
      expect(await secondInstance.consume(rule)).toMatchObject({
        allowed: true,
      });
      expect(await firstInstance.consume(rule)).toMatchObject({
        allowed: false,
      });
    } finally {
      await firstInstance.onModuleDestroy();
      await secondInstance.onModuleDestroy();
    }
  });
});
