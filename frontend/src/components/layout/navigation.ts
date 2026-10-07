import { BookOpen, ClipboardList, LayoutDashboard, Settings, Users } from "lucide-react";
export const navigation = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/academic", label: "Akademik", icon: BookOpen },
  { href: "/app/reports/progress", label: "Rapor", icon: ClipboardList },
  { href: "/app/settings/school", label: "Menu", icon: Settings },
];
export const secondaryNavigation = [{ href: "/app/academic/students", label: "Murid", icon: Users }, { href: "/app/settings/staff", label: "Staf", icon: Users }];
