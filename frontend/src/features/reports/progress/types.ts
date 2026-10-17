export type Semester = { id: string; name: string; academic_year_name: string };
export type ReportStatus =
	| "DRAFT"
	| "SUBMITTED"
	| "IN_REVIEW"
	| "REVISION_REQUIRED"
	| "APPROVED"
	| "PUBLISHED";
export type ProgressItem = {
	id: string;
	name: string;
	report_id?: string;
	revision_note?: string | null;
	status?: ReportStatus;
	completion_percent: number;
	latest_published_version_number?: number | null;
	latest_published_at?: string | null;
};
export type ProgressCounts = {
	total: number;
	notCreated: number;
	draft: number;
	review: number;
	publish: number;
	published: number;
};

export type ProgressPage = {
	items: ProgressItem[];
	limit: number;
	page: number;
	summary: ProgressCounts;
	total: number;
};
