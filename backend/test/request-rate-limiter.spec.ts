import { HttpException, HttpStatus } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import {
  rateLimitFingerprint,
  RequestRateLimiter,
} from "../src/common/request-rate-limiter";

describe("RequestRateLimiter", () => {
  it("allows normal requests, then rejects only after the configured limit", () => {
    const limiter = new RequestRateLimiter(() => 1_000);
    const rule = { key: "login:opaque-key", limit: 3, windowMs: 60_000 };

    expect(limiter.consume(rule).allowed).toBe(true);
    expect(limiter.consume(rule).allowed).toBe(true);
    expect(limiter.consume(rule).allowed).toBe(true);
    expect(limiter.consume(rule)).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
  });

  it("resets a bucket after its time window", () => {
    let now = 1_000;
    const limiter = new RequestRateLimiter(() => now);
    const rule = { key: "parent:opaque-key", limit: 1, windowMs: 1_000 };

    limiter.assert(rule);
    expect(() => limiter.assert(rule)).toThrow(HttpException);
    now += 1_000;
    expect(() => limiter.assert(rule)).not.toThrow();
  });

  it("uses an opaque fingerprint rather than storing raw IPs, emails, or tokens", () => {
    const raw = "guru.aisyah@example.test";
    expect(rateLimitFingerprint(raw)).not.toContain(raw);
    expect(rateLimitFingerprint(raw)).toHaveLength(64);
  });

  it("returns HTTP 429 after the limit is reached", () => {
    const limiter = new RequestRateLimiter(() => 1_000);
    const rule = { key: "register:opaque-key", limit: 1, windowMs: 60_000 };
    limiter.assert(rule);

    try {
      limiter.assert(rule);
      throw new Error("Expected limiter to reject");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });
});
