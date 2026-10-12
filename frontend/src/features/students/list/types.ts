export type Student = {
	id: string;
	name: string;
	student_number?: string | null;
	class_name?: string | null;
	class_group_id?: string | null;
};
export type StudentList = { items: Student[]; total: number; page: number };
export type ClassGroup = { id: string; name: string };
export type AdmissionRequest = {
	id: string;
	status: "PENDING" | "APPROVED" | "REJECTED";
	payload: { name: string };
	class_name: string;
	requester_name: string;
	review_note?: string | null;
	created_at: string;
};
export type StudentTab = "students" | "requests";
