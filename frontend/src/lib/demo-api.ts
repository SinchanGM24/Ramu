const reportId = "demo-report";
const studentId = "demo-student";
const semesterId = "demo-semester";
let reviewStatus: "SUBMITTED" | "IN_REVIEW" | "APPROVED" = "SUBMITTED";
let parentSession = false;

const editor = { report: { student_name: "Alya Putri", student_number: "TK-2026-014", semester_name: "Semester I", status: "DRAFT" }, areas: ["Nilai Agama dan Moral", "Fisik Motorik", "Kognitif", "Bahasa", "Sosial Emosional", "Seni"].map((name, index) => ({ id: `area-${index}`, name, indicator_count: 1, assessed_count: 1, narrative: "Alya menunjukkan perkembangan yang baik melalui kegiatan belajar dan bermain." })), assessments: [], growth: { weight_kg: 18.5, height_cm: 108 }, attendance: { sick_days: 1, permission_days: 0, unexcused_days: 0 } };

export function demoResponse(path: string, options: RequestInit): unknown {
  if (path === "/parent/verify" && options.method === "POST") {
    const input = (typeof options.body === "string" ? JSON.parse(options.body) : {}) as { token?: string; pin?: string };
    if (input.token !== "demo-parent" || input.pin !== "123456") throw new Error("PIN atau tautan tidak valid.");
    parentSession = true;
    return { expiresAt: "2026-10-07T12:00:00.000Z" };
  }
  if (path.includes("/publish") && options.method === "POST") return { parentAccess: { link: "/r/demo-parent", pin: "123456" } };
  if (path.includes("/transition") && options.method === "POST") {
    const action = typeof options.body === "string" ? JSON.parse(options.body).action : undefined;
    if (action === "review") reviewStatus = "IN_REVIEW";
    if (action === "approve") reviewStatus = "APPROVED";
    if (action === "revision") reviewStatus = "SUBMITTED";
    return { id: reportId, status: reviewStatus };
  }
  if (options.method && options.method !== "GET") return { id: reportId, status: "DRAFT" };
  if (path === "/academic/semesters") return [{ id: semesterId, name: "Semester I" }];
  if (path === "/academic/years") return [{ id: "demo-year", name: "2026/2027", starts_on: "2026-07-01", ends_on: "2027-06-30" }];
  if (path === "/academic/classes") return [{ id: "demo-class", name: "Kelompok A", academic_year_name: "2026/2027" }];
  if (path === "/students") return { items: [{ id: studentId, name: "Alya Putri", student_number: "TK-2026-014", class_name: "Kelompok A" }] };
  if (path.startsWith("/reports/progress")) return [{ id: studentId, name: "Alya Putri", report_id: reportId, status: "DRAFT" }, { id: "demo-student-2", name: "Bima Pratama", report_id: null, status: null }];
  if (path === "/reports/review-queue") return [{ id: reportId, status: reviewStatus, submitted_at: "2026-10-01T08:00:00.000Z", student_name: "Alya Putri", semester_name: "Semester I" }];
  if (path.includes("/editor")) return editor;
  if (path.includes("/completeness")) return { complete: true, missingAssessments: [], missingNarratives: [], missingSemesterData: false };
  if (path.includes("/extracurricular")) return [{ id: "extra-1", activity_name: "Menari", grade: "A" }];
  if (path.includes("/portfolio")) return [{ id: "portfolio-1", original_filename: "kegiatan-seni.jpg", content_type: "image/jpeg", byte_size: 245000, caption: "Membuat karya kolase bersama teman.", included_in_report: true, created_at: "2026-09-20T08:00:00.000Z" }];
  if (path.includes("/deliveries")) return [{ id: "delivery-1", guardian_name: "Ibu Sari", relationship: "Ibu", recipient_phone: "0812-0000-0000", version_number: 1, status: "SENT", queued_at: "2026-10-02T08:00:00.000Z", attempt_count: 1, failure_reason: null }];
  if (path.startsWith("/assessment/students/")) return { student: { id: studentId, name: "Alya Putri" }, scales: ["BB", "MB", "BSH", "BSB"].map((code, index) => ({ id: `scale-${index}`, code, label: code, position: index + 1 })), indicators: [{ id: "indicator-1", area_id: "area-1", area_name: "Nilai Agama dan Moral", description: "Mengikuti kegiatan doa bersama", sub_area_name: "Pembiasaan", scale_option_id: "scale-2" }] };
  if (path === "/schools/current") return { name: "TK Contoh Ceria", address: "Kota Contoh", phone: "0812-0000-0000" };
  if (path === "/parent/report") {
    if (!parentSession) throw new Error("Sesi wali belum tersedia.");
    return { report: { assessments: [{ description: "Mengikuti kegiatan doa bersama", code: "BSH" }], narratives: [{ name: "Bahasa", content: "Alya mampu berkomunikasi dengan baik." }], extracurricular: [{ activity_name: "Menari", grade: "A" }], portfolio: [{ original_filename: "kegiatan-seni.jpg", caption: "Membuat karya kolase bersama teman." }] } };
  }
  return {};
}
