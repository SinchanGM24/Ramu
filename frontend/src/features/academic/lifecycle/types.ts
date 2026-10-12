export type LifecycleStudent = {
	id: string;
	name: string;
	student_number?: string | null;
	class_name?: string | null;
	lifecycle_status: "ACTIVE" | "GRADUATED";
};
export type LifecycleClassGroup = { id: string; name: string };
export type LifecycleMode = "transfer" | "graduation";
export type LifecycleProposal = {
	id: string;
	operation_type: "TRANSFER" | "GRADUATION";
	reason?: string | null;
	payload: { items?: { studentId: string }[]; studentIds?: string[] };
	created_at: string;
	requester_name: string;
};
