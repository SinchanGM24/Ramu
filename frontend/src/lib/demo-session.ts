export type DemoRole = "SCHOOL_ADMIN" | "TEACHER" | "PRINCIPAL";

const storageKey = "ramu-demo-role";

export const demoRoles: Array<{ role: DemoRole; label: string; description: string }> = [
  { role: "SCHOOL_ADMIN", label: "Admin Sekolah", description: "Mengelola data sekolah, murid, dan rapor." },
  { role: "TEACHER", label: "Guru", description: "Mengisi penilaian dan melengkapi rapor murid." },
  { role: "PRINCIPAL", label: "Kepala Sekolah", description: "Meninjau, menyetujui, dan menerbitkan rapor." },
];

export function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function getDemoRole(): DemoRole {
  if (typeof window === "undefined" || !isDemoMode()) return "SCHOOL_ADMIN";
  const stored = window.localStorage.getItem(storageKey);
  return stored === "TEACHER" || stored === "PRINCIPAL" || stored === "SCHOOL_ADMIN" ? stored : "SCHOOL_ADMIN";
}

export function setDemoRole(role: DemoRole) {
  if (typeof window !== "undefined" && isDemoMode()) window.localStorage.setItem(storageKey, role);
}

export function demoRoleLabel(role: DemoRole) {
  return demoRoles.find((item) => item.role === role)?.label ?? "Admin Sekolah";
}
