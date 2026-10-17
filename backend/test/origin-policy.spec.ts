import { describe, expect, it } from "vitest";
import {
  getTrustedOrigins,
  validateCookieMutationOrigin,
} from "../src/common/origin-policy";

describe("origin policy", () => {
  it("accepts explicit trusted origins and rejects wildcards", () => {
    expect(
      getTrustedOrigins("https://ramu.example, https://admin.ramu.example"),
    ).toEqual(["https://ramu.example", "https://admin.ramu.example"]);
    expect(() => getTrustedOrigins("*")).toThrow("tidak boleh wildcard");
    expect(() => getTrustedOrigins("https://ramu.example/aplikasi")).toThrow(
      "tanpa path",
    );
  });

  it("requires a trusted origin for cookie-authenticated mutations", () => {
    expect(
      validateCookieMutationOrigin({
        method: "PATCH",
        cookies: { ramu_session: "sesi-staf" },
        origin: "https://ramu.example",
        trustedOrigins: ["https://ramu.example"],
      }),
    ).toBeNull();

    expect(
      validateCookieMutationOrigin({
        method: "POST",
        cookies: { ramu_parent_session: "sesi-wali" },
        referer: "https://penyerang.example/form",
        trustedOrigins: ["https://ramu.example"],
      }),
    ).toContain("tidak tepercaya");
  });

  it("does not block unauthenticated requests or safe reads", () => {
    expect(
      validateCookieMutationOrigin({
        method: "POST",
        cookies: {},
        trustedOrigins: ["https://ramu.example"],
      }),
    ).toBeNull();
    expect(
      validateCookieMutationOrigin({
        method: "GET",
        cookies: { ramu_session: "sesi-staf" },
        trustedOrigins: ["https://ramu.example"],
      }),
    ).toBeNull();
  });
});
