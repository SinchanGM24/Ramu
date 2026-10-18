import {
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import {
  rateLimitFingerprint,
  RequestRateLimiter,
} from "../src/common/request-rate-limiter";

describe("RequestRateLimiter", () => {
  it("allows normal requests, then rejects only after the configured limit", async () => {
    const limiter = RequestRateLimiter.withClock(() => 1_000);
    const rule = { key: "login:opaque-key", limit: 3, windowMs: 60_000 };

    expect((await limiter.consume(rule)).allowed).toBe(true);
    expect((await limiter.consume(rule)).allowed).toBe(true);
    expect((await limiter.consume(rule)).allowed).toBe(true);
    expect(await limiter.consume(rule)).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
  });

  it("resets a bucket after its time window", async () => {
    let now = 1_000;
    const limiter = RequestRateLimiter.withClock(() => now);
    const rule = { key: "parent:opaque-key", limit: 1, windowMs: 1_000 };

    await limiter.assert(rule);
    await expect(limiter.assert(rule)).rejects.toBeInstanceOf(HttpException);
    now += 1_000;
    await expect(limiter.assert(rule)).resolves.toBeUndefined();
  });

  it("uses an opaque fingerprint rather than storing raw IPs, emails, or tokens", () => {
    const raw = "guru.aisyah@example.test";
    expect(rateLimitFingerprint(raw)).not.toContain(raw);
    expect(rateLimitFingerprint(raw)).toHaveLength(64);
  });

  it("returns HTTP 429 after the limit is reached", async () => {
    const limiter = RequestRateLimiter.withClock(() => 1_000);
    const rule = { key: "register:opaque-key", limit: 1, windowMs: 60_000 };
    await limiter.assert(rule);
    await expect(limiter.assert(rule)).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
  });

  it("uses Redis atomically when a shared store is configured", async () => {
    const evalCommand = vi
      .fn()
      .mockResolvedValueOnce([1, 60_000])
      .mockResolvedValueOnce([2, 59_000]);
    const limiter = new RequestRateLimiter(
      { RATE_LIMIT_REDIS_URL: "redis://rate-limit.test" },
      {
        eval: evalCommand,
        isOpen: true,
        on: vi.fn(),
      } as never,
    );
    const rule = { key: "login:opaque-key", limit: 1, windowMs: 60_000 };

    expect(await limiter.consume(rule)).toEqual({
      allowed: true,
      retryAfterSeconds: 0,
    });
    expect(await limiter.consume(rule)).toEqual({
      allowed: false,
      retryAfterSeconds: 59,
    });
    expect(evalCommand).toHaveBeenCalledWith(
      expect.stringContaining("PEXPIRE"),
      {
        arguments: ["60000"],
        keys: ["ramu:rate-limit:login:opaque-key"],
      },
    );
  });

  it("fails closed when configured Redis is unavailable", async () => {
    const limiter = new RequestRateLimiter(
      { RATE_LIMIT_REDIS_URL: "redis://rate-limit.test" },
      { isOpen: false, on: vi.fn() } as never,
    );

    await expect(
      limiter.consume({ key: "login:opaque-key", limit: 1, windowMs: 60_000 }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
