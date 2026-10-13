export type PublicationStatus = "APPROVED" | "PUBLISHED";

export type PublicationReport = {
	id: string;
	name: string;
	report_id: string;
	status: PublicationStatus;
};

export type Semester = {
	id: string;
	name: string;
	academic_year_name: string;
};
