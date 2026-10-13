export type Semester = { id: string; name: string; academic_year_name: string };
export type ReportStatus =
	| "DRAFT"
	| "SUBMITTED"
	| "IN_REVIEW"
	| "REVISION_REQUIRED"
	| "APPROVED"
	| "PUBLISHED";
export type ProgressItem = { id: string; name: string; report_id?: string; status?: ReportStatus };
export type ProgressFilter = "ALL" | "NOT_CREATED" | "WORKING" | ReportStatus;
export type ProgressCounts = {
	total: number;
	notCreated: number;
	draft: number;
	review: number;
	publish: number;
	published: number;
};
