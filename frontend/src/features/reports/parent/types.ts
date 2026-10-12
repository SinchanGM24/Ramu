export type ParentReportItem = {
	area_name?: string;
	sub_area_name?: string;
	description: string;
	code: string;
};

export type ParentReport = {
	student?: {
		name?: string;
		nickname?: string | null;
		student_number?: string | null;
		class_name?: string | null;
	};
	semester?: { name?: string; academic_year_name?: string };
	assessments?: ParentReportItem[];
	narratives?: { name: string; content: string }[];
	growth?: { weight_kg?: string | number; height_cm?: string | number } | null;
	attendance?: { sick_days?: number; permission_days?: number; unexcused_days?: number } | null;
	extracurricular?: { activity_name: string; grade: string }[];
};
