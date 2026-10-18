import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("security-definer hardening migration", () => {
  it("restricts parent access functions to the app role and fixes their search path", async () => {
    const migration = await readFile(
      resolve(
        process.cwd(),
        "src/database/migrations/038_harden_parent_security_definer_functions.sql",
      ),
      "utf8",
    );

    for (const signature of [
      "public.verify_parent_report(text, text)",
      "public.get_parent_report(text)",
      "public.get_parent_report_pdf_key(text)",
    ]) {
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature} FROM PUBLIC`);
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature} FROM ramu_app`);
      expect(migration).toContain(`GRANT EXECUTE ON FUNCTION ${signature} TO ramu_app`);
    }

    expect(migration).toContain("SET search_path = pg_catalog");
    expect(migration).toContain("FROM public.report_access");
    expect(migration).toContain("FROM public.parent_report_sessions");
    expect(migration).toContain("REVOKE CREATE ON SCHEMA public FROM ramu_app");
  });
});
