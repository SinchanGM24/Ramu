import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("student admission resubmission migration", () => {
  it("keeps a traceable, single correction chain for each rejected request", async () => {
    const migration = await readFile(
      resolve(
        process.cwd(),
        "src/database/migrations/037_student_admission_request_resubmissions.sql",
      ),
      "utf8",
    );

    expect(migration).toContain("resubmitted_from_request_id");
    expect(migration).toContain("REFERENCES student_admission_requests(id)");
    expect(migration).toContain("idx_student_admission_request_one_resubmission");
  });
});
