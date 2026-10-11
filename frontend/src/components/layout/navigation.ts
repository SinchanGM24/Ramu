import { BookOpen, ClipboardList, LayoutDashboard, School, UserCircle, Users } from "lucide-react";
export const navigation = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/academic", label: "Akademik", icon: BookOpen },
  { href: "/app/reports/progress", label: "Rapor", icon: ClipboardList },
];
export const academicNavigation = [
  { href: "/app/academic/students", label: "Siswa", icon: Users },
  { href: "/app/academic/lifecycle", label: "Perpindahan & Kelulusan", icon: Users },
  { href: "/app/academic/archive", label: "Arsip", icon: Users },
];
export const settingsNavigation = [
  { href: "/app/settings/school", label: "Profil sekolah", icon: School },
  { href: "/app/settings/profile", label: "Profil akun", icon: UserCircle },
  { href: "/app/settings/staff", label: "Kelola akun", icon: Users },
];
