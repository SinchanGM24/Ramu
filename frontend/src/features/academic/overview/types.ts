export type AcademicYear = { id: string; name: string; is_active: boolean };
export type ClassPeriod = {
	id: string;
	name: string;
	class_group_id: string;
	is_active: boolean;
	academic_year_name?: string;
	teacher_names?: string | null;
	student_count?: number;
};
export type StaffMember = {
	id: string;
	name: string;
	role: "TEACHER" | "PRINCIPAL" | "SCHOOL_ADMIN";
	is_active: boolean;
};
export type TeacherAssignment = { id: string; teacher_name: string; ended_at?: string | null };
