const reportId = "demo-report";
const studentId = "demo-student";
const semesterId = "demo-semester";
const scaleCodes = ["BB", "MB", "BSH", "BSB"];
let reviewStatus: "SUBMITTED" | "IN_REVIEW" | "APPROVED" = "SUBMITTED";
let parentSession = false;
const selected = new Map<string, string>(); const narratives = new Map<string, string>();

const areas = [
  ["Nilai-Nilai Agama dan Moral", [["Nilai-Nilai Agama dan Moral", 6]]],
  ["Fisik Motorik", [["Motorik Kasar", 8], ["Motorik Halus", 6], ["Kesehatan dan Perilaku Keselamatan", 7]]],
  ["Kognitif", [["Belajar dan Pemecahan Masalah", 8], ["Berpikir Logis", 5], ["Berpikir Simbolik", 4]]],
  ["Bahasa", [["Memahami Bahasa", 5], ["Mengungkapkan Bahasa", 10], ["Keaksaraan", 4]]],
  ["Sosial Emosional", [["Kesadaran Diri", 6], ["Tanggungjawab Diri dan Orang Lain", 3], ["Perilaku Prososial", 4]]],
  ["Seni", [["Menikmati lagu dan suara", 2], ["Tertarik dengan kegiatan seni", 10]]],
] as const;
const indicatorNames: Record<string, string[]> = {
  "Nilai-Nilai Agama dan Moral": ["Mengenal agama yang dianut", "Meniru gerakan beribadah", "Mengucapkan doa sebelum dan sesudah kegiatan", "Membedakan perilaku baik dan buruk", "Membiasakan perilaku baik", "Mengucapkan dan membalas salam"],
  "Motorik Kasar": ["Melakukan gerakan tubuh terkoordinasi", "Menjaga keseimbangan tubuh", "Melompat dengan dua kaki", "Berlari mengikuti arah", "Melempar dan menangkap bola", "Menirukan gerakan senam", "Mengikuti permainan fisik", "Mengendalikan gerak tubuh"],
  "Motorik Halus": ["Menggunakan alat tulis", "Menggunting sesuai pola", "Menempel bahan kegiatan", "Meronce benda sederhana", "Melipat kertas", "Mewarnai gambar"],
  "Kesehatan dan Perilaku Keselamatan": ["Menjaga kebersihan diri", "Mengenal kebiasaan hidup sehat", "Menggunakan toilet dengan benar", "Mengenal makanan bergizi", "Mengenali situasi berbahaya", "Mematuhi aturan keselamatan", "Mengenal rambu lalu lintas"],
};
function workspaceAreas() { return areas.map(([name, subAreas], areaIndex) => ({ id: `area-${areaIndex + 1}`, name, narrative: narratives.get(`area-${areaIndex + 1}`) || "", subAreas: subAreas.map(([subName, count], subIndex) => ({ id: `sub-${areaIndex + 1}-${subIndex + 1}`, name: subName, indicators: Array.from({ length: count }, (_, index) => { const id = `indicator-${areaIndex + 1}-${subIndex + 1}-${index + 1}`; return { id, description: indicatorNames[subName]?.[index] || `${subName}: indikator perkembangan ${index + 1}`, scaleOptionId: selected.get(id) || null, scaleCode: scaleCodes.find((code, scaleIndex) => `scale-${scaleIndex + 1}` === selected.get(id)) || null }; }) })) })); }
function workspace() { return { report: { id: reportId, status: "DRAFT", student_name: "Alya Putri", nickname: "Alya", student_number: "TK-2026-014", class_name: "Kelompok A", semester_name: "Semester I", academic_year_name: "2026/2027" }, scales: scaleCodes.map((code, index) => ({ id: `scale-${index + 1}`, code, label: code })), areas: workspaceAreas(), growth: { weight_kg: 18.5, height_cm: 108 }, attendance: { sick_days: 1, permission_days: 0, unexcused_days: 0 }, guardians: [{ id: "guardian-1", name: "Sari Wulandari", relationship: "Ibu", phone: "0812-0000-0000", occupation: "Wiraswasta", is_primary: true }] }; }
const student = { id: studentId, name: "Alya Putri", nickname: "Alya", student_number: "TK-2026-014", class_id: "demo-class", class_name: "Kelompok A", birth_date: "2021-03-12", birth_place: "Bandung", gender: "FEMALE", religion: "Islam", child_order: 1, address: "Jl. Melati No. 12, Bandung", guardians: [{ id: "guardian-1", name: "Sari Wulandari", relationship: "Ibu", phone: "0812-0000-0000", occupation: "Wiraswasta", is_primary: true }] };

export function demoResponse(path: string, options: RequestInit): unknown {
  const body = typeof options.body === "string" ? JSON.parse(options.body) as Record<string, unknown> : {};
  if (path === "/parent/verify" && options.method === "POST") { if (body.token !== "demo-parent" || body.pin !== "123456") throw new Error("PIN atau tautan tidak valid."); parentSession = true; return { expiresAt: "2026-10-07T12:00:00.000Z" }; }
  if (path.includes("/assessments/") && options.method === "PUT") { const indicatorId = path.split("/").at(-1)!; selected.set(indicatorId, String(body.scaleOptionId)); return { id: `assessment-${indicatorId}` }; }
  if (path.includes("/workspace/narratives/") && options.method === "PUT") { narratives.set(path.split("/").at(-1)!, String(body.content || "")); return { id: "narrative-demo" }; }
  if (path.includes("/transition") && options.method === "POST") { const action = body.action; if (action === "review") reviewStatus = "IN_REVIEW"; if (action === "approve") reviewStatus = "APPROVED"; if (action === "revision") reviewStatus = "SUBMITTED"; return { id: reportId, status: reviewStatus }; }
  if (path.includes("/publish") && options.method === "POST") return { parentAccess: { link: "/r/demo-parent", pin: "123456" } };
  if (options.method && options.method !== "GET") return { id: reportId, status: "DRAFT" };
  if (path === "/academic/semesters") return [{ id: semesterId, name: "Semester I" }];
  if (path === "/academic/years") return [{ id: "demo-year", name: "2026/2027", starts_on: "2026-07-01", ends_on: "2027-06-30" }];
  if (path === "/academic/classes") return [{ id: "demo-class", name: "Kelompok A", academic_year_name: "2026/2027" }];
  if (path === "/students") return { items: [{ id: studentId, name: student.name, student_number: student.student_number, class_name: student.class_name }] };
  if (path === `/students/${studentId}`) return student;
  if (path.startsWith("/reports/progress")) return [{ id: studentId, name: student.name, report_id: reportId, status: "DRAFT" }, { id: "demo-student-2", name: "Bima Pratama", report_id: null, status: null }];
  if (path === "/reports/review-queue") return [{ id: reportId, status: reviewStatus, submitted_at: "2026-10-01T08:00:00.000Z", student_name: student.name, semester_name: "Semester I" }];
  if (path === `/reports/${reportId}/workspace`) return workspace();
  if (path.includes("/editor")) { const data = workspace(); return { report: data.report, areas: data.areas.map((area) => ({ id: area.id, name: area.name, indicator_count: area.subAreas.flatMap((sub) => sub.indicators).length, assessed_count: area.subAreas.flatMap((sub) => sub.indicators).filter((indicator) => indicator.scaleOptionId).length, narrative: area.narrative })), assessments: data.areas.flatMap((area) => area.subAreas.flatMap((sub) => sub.indicators.map((indicator) => ({ area_id: area.id, sub_area_name: sub.name, description: indicator.description, scale_code: indicator.scaleCode })))), growth: data.growth, attendance: data.attendance }; }
  if (path.includes("/completeness")) return { complete: false, missingAssessments: ["Lengkapi penilaian indikator secara individual"], missingNarratives: ["Lengkapi narasi perkembangan"], missingSemesterData: false };
  if (path.includes("/extracurricular")) return [{ id: "extra-1", activity_name: "Menari", grade: "A" }];
  if (path.includes("/portfolio")) return [{ id: "portfolio-1", original_filename: "kegiatan-seni.jpg", content_type: "image/jpeg", byte_size: 245000, caption: "Membuat karya kolase bersama teman.", included_in_report: true, created_at: "2026-09-20T08:00:00.000Z" }];
  if (path.includes("/deliveries")) return [{ id: "delivery-1", guardian_name: "Sari Wulandari", relationship: "Ibu", recipient_phone: "0812-0000-0000", version_number: 1, status: "SENT", queued_at: "2026-10-02T08:00:00.000Z", attempt_count: 1, failure_reason: null }];
  if (path === "/schools/current") return { name: "TK Contoh Ceria", address: "Kota Contoh", phone: "0812-0000-0000" };
  if (path === "/parent/report") { if (!parentSession) throw new Error("Sesi wali belum tersedia."); const data = workspace(); return { report: { student: data.report, semester: { name: data.report.semester_name, academic_year_name: data.report.academic_year_name }, assessments: data.areas.flatMap((area) => area.subAreas.flatMap((sub) => sub.indicators.map((indicator) => ({ area_name: area.name, sub_area_name: sub.name, description: indicator.description, code: indicator.scaleCode || "-" })))), narratives: data.areas.filter((area) => area.narrative).map((area) => ({ name: area.name, content: area.narrative })), growth: data.growth, attendance: data.attendance, extracurricular: [{ activity_name: "Menari", grade: "A" }] } }; }
  return {};
}
