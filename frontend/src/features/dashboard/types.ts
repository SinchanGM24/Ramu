export type DashboardRole = "SCHOOL_ADMIN" | "TEACHER" | "PRINCIPAL";

export type DashboardStat = {
	id: string;
	label: string;
	value: number;
	description: string;
	href: string;
};

export type DashboardSummary = {
	role: DashboardRole;
	schoolName: string;
	academicYearName?: string | null;
	semesterName?: string | null;
	stats: DashboardStat[];
};
