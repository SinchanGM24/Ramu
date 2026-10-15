export type LifecycleStudent = {
	id: string;
	name: string;
	student_number?: string | null;
	class_name?: string | null;
	lifecycle_status: "ACTIVE" | "GRADUATED";
};
export type LifecycleClassGroup = { id: string; name: string };
export type LifecycleMode = "transfer" | "graduation";

export type LifecycleProposalStudent = {
	studentId: string;
	studentName: string;
	className?: string | null;
	targetClassGroupId?: string | null;
	targetClassName?: string | null;
	effectiveOn?: string | null;
	reason?: string | null;
};

export type LifecycleProposal = {
	id: string;
	operation_type: "TRANSFER" | "GRADUATION";
	reason?: string | null;
	payload: {
		items?: {
			studentId: string;
			targetClassGroupId: string;
			effectiveOn: string;
			reason?: string;
		}[];
		studentIds?: string[];
		effectiveOn?: string;
	};
	status: "PENDING" | "REJECTED";
	created_at: string;
	updated_at: string;
	reviewed_at?: string | null;
	review_note?: string | null;
	resubmitted_from_request_id?: string | null;
	requester_name: string;
	students: LifecycleProposalStudent[];
};
