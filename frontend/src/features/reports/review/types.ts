export type ReviewReport = {
	id: string;
	status: "SUBMITTED" | "IN_REVIEW";
	submitted_at: string | null;
	student_name: string;
	semester_name: string;
};

export type Completeness = {
	complete: boolean;
	missingAssessments: string[];
	missingNarratives: string[];
	missingSemesterData: boolean;
};
