export type ReportScale = { id: string; code: string; label: string };
export type ReportIndicator = { id: string; description: string; scaleOptionId?: string | null };
export type ReportArea = {
	id: string;
	name: string;
	narrative: string;
	narrativeStale?: boolean;
	subAreas: { id: string; name: string; indicators: ReportIndicator[] }[];
};
export type ReportWorkspace = {
	report: {
		status: string;
		student_name: string;
		class_name?: string | null;
		semester_name: string;
		academic_year_name: string;
	};
	scales: ReportScale[];
	areas: ReportArea[];
	growth: {
		weight_kg: string | number;
		height_cm: string | number;
		head_circumference_cm?: string | number | null;
	} | null;
	attendance: { sick_days: number; permission_days: number; unexcused_days: number } | null;
};
