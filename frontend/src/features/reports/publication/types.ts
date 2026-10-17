export type PublicationStatus =
	| "DRAFT"
	| "REVISION_REQUIRED"
	| "SUBMITTED"
	| "IN_REVIEW"
	| "APPROVED"
	| "PUBLISHED";
export type DeliveryStatus = "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";
export type DeliveryFilter = "ALL" | "NEEDS_DELIVERY" | "OPENED" | "FAILED";

export type PublicationReport = {
	id: string;
	name: string;
	report_id: string;
	status: PublicationStatus;
	submitted_at?: string | null;
	report_updated_at?: string | null;
	latest_published_version_number?: number | null;
	latest_published_at?: string | null;
	delivery_status?: DeliveryStatus | null;
	delivery_whatsapp_opened_at?: string | null;
};

export type PublicationSummary = {
	approved: number;
	correction: number;
	published: number;
	waitingReview: number;
};

export type PublicationPage = {
	items: PublicationReport[];
	limit: number;
	page: number;
	summary: PublicationSummary;
	total: number;
};

export type Semester = {
	id: string;
	name: string;
	academic_year_name: string;
};
