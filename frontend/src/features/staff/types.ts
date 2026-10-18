export type StaffMember = {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	role: "TEACHER" | "PRINCIPAL" | "SCHOOL_ADMIN";
	is_active: boolean;
};
export type StaffResponse = { items: StaffMember[]; total: number; page: number };
