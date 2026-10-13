import { BookOpen, ClipboardList, LayoutDashboard, School, UserCircle, Users } from "lucide-react";
export type AppRole = "SCHOOL_ADMIN" | "TEACHER" | "PRINCIPAL";
export const navigation = [
	{
		href: "/app/dashboard",
		label: "Dashboard",
		icon: LayoutDashboard,
		roles: ["SCHOOL_ADMIN", "TEACHER", "PRINCIPAL"] as AppRole[],
	},
	{
		href: "/app/academic",
		label: "Akademik",
		icon: BookOpen,
		roles: ["SCHOOL_ADMIN", "PRINCIPAL"] as AppRole[],
	},
];

export const mobileNavigation = [
	...navigation,
	{
		href: "/app/reports/progress",
		label: "Rapor",
		icon: ClipboardList,
		roles: ["SCHOOL_ADMIN", "TEACHER"] as AppRole[],
	},
	{
		href: "/app/reports/review",
		label: "Rapor",
		icon: ClipboardList,
		roles: ["PRINCIPAL"] as AppRole[],
	},
];
export const academicNavigation = [
	{
		href: "/app/academic/students",
		label: "Siswa",
		icon: Users,
		roles: ["SCHOOL_ADMIN", "TEACHER", "PRINCIPAL"] as AppRole[],
	},
	{
		href: "/app/academic/lifecycle",
		label: "Perpindahan & Kelulusan",
		icon: Users,
		roles: ["SCHOOL_ADMIN", "TEACHER", "PRINCIPAL"] as AppRole[],
	},
	{
		href: "/app/academic/archive",
		label: "Arsip",
		icon: Users,
		roles: ["SCHOOL_ADMIN", "TEACHER", "PRINCIPAL"] as AppRole[],
	},
];
export const settingsNavigation = [
	{
		href: "/app/settings/school",
		label: "Profil sekolah",
		icon: School,
		roles: ["SCHOOL_ADMIN", "PRINCIPAL"] as AppRole[],
	},
	{
		href: "/app/settings/staff",
		label: "Kelola akun",
		icon: Users,
		roles: ["SCHOOL_ADMIN"] as AppRole[],
	},
	{
		href: "/app/settings/profile",
		label: "Profil akun",
		icon: UserCircle,
		roles: ["SCHOOL_ADMIN", "TEACHER", "PRINCIPAL"] as AppRole[],
	},
];
