export type PublicationStatus = "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "PUBLISHED";
export type DeliveryStatus = "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";

export type PublicationReport = {
	id: string;
	name: string;
	report_id: string;
	status: PublicationStatus;
	delivery_status?: DeliveryStatus | null;
};

export type Semester = {
	id: string;
	name: string;
	academic_year_name: string;
};
