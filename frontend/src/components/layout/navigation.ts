import { BookOpen, ClipboardList, LayoutDashboard, Settings, Users } from "lucide-react";
import { DemoRole } from "@/lib/demo-session";

export const navigation = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["SCHOOL_ADMIN", "TEACHER", "PRINCIPAL"] as DemoRole[] },
  { href: "/app/academic", label: "Akademik", icon: BookOpen, roles: ["SCHOOL_ADMIN"] as DemoRole[] },
  { href: "/app/reports/progress", label: "Rapor", icon: ClipboardList, roles: ["SCHOOL_ADMIN", "TEACHER"] as DemoRole[] },
  { href: "/app/reports/review", label: "Tinjauan", icon: ClipboardList, roles: ["PRINCIPAL"] as DemoRole[] },
  { href: "/app/settings/school", label: "Menu", icon: Settings, roles: ["SCHOOL_ADMIN"] as DemoRole[] },
];

export const secondaryNavigation = [{ href: "/app/academic/students", label: "Murid", icon: Users, roles: ["SCHOOL_ADMIN"] as DemoRole[] }];
