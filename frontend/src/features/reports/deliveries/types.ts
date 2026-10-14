export type Delivery = {
	id: string;
	recipient_phone: string;
	status: "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";
	attempt_count: number;
	failure_reason?: string | null;
	queued_at: string;
	guardian_name: string;
	relationship: string;
	version_number: number;
};

export type Recipient = {
	id: string;
	name: string;
	relationship: string;
	phone: string;
	is_primary: boolean;
	student_lifecycle_status: "ACTIVE" | "GRADUATED";
};

export type ManualDispatch = {
	whatsAppUrl: string;
};

export type DeliveryContext = {
	studentId: string;
};
