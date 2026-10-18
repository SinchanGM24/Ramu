import { describe, expect, it } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { AcademicController } from "../src/academic/academic.controller";
import { AuthService, type Role } from "../src/auth/auth.service";
import { LifecycleController } from "../src/lifecycle/lifecycle.controller";
import { ReportsController } from "../src/reports/reports.controller";
import { SchoolsController } from "../src/schools/schools.controller";
import { StaffController } from "../src/staff/staff.controller";

function request(role: Role) {
  return {
    auth: {
      userId: "user-1",
      schoolId: "school-1",
      role,
      email: "user@example.test",
      sessionId: "session-1",
    },
  } as never;
}

describe("authorization matrix", () => {
  const auth = new AuthService({} as never);

  it("reserves academic-year, school, and account administration for School Admin", async () => {
    const academic = new AcademicController(auth, {} as never, {} as never);
    const schools = new SchoolsController(
      auth,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const staff = new StaffController(auth, {} as never, {} as never);

    await expect(
      academic.createYear(request("TEACHER"), { name: "2027" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      academic.createYear(request("PRINCIPAL"), { name: "2027" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      schools.update(request("PRINCIPAL"), {
        name: "TK Contoh Ceria",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      staff.create(request("TEACHER"), {
        name: "Guru Baru",
        email: "guru-baru@example.test",
        password: "kata-sandi-aman",
        role: "TEACHER",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("reserves direct lifecycle execution and report publication for School Admin", async () => {
    const lifecycle = new LifecycleController(auth, {} as never, {} as never);
    const reports = new ReportsController(
      auth,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      lifecycle.graduate(request("PRINCIPAL"), {
        studentIds: ["00000000-0000-4000-8000-000000000001"],
        effectiveOn: "2027-06-30",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      reports.publish(request("TEACHER"), "report-1"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      reports.publish(request("PRINCIPAL"), "report-1"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("keeps teacher proposals and principal decisions as separate responsibilities", async () => {
    const lifecycle = new LifecycleController(auth, {} as never, {} as never);

    await expect(
      lifecycle.proposeGraduation(request("PRINCIPAL"), {
        studentIds: ["00000000-0000-4000-8000-000000000001"],
        effectiveOn: "2027-06-30",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      lifecycle.decide(request("TEACHER"), "request-1", {
        decision: "APPROVED",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
