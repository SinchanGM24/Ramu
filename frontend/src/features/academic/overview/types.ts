export type AcademicYear = { id: string; name: string; is_active: boolean };
export type AcademicSemester = {
	id: string;
	name: string;
	academic_year_id: string;
	academic_year_name: string;
	is_active: boolean;
};
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
export type TeacherAssignment = {
	id: string;
	teacher_name: string;
	teacher_user_id: string;
	ended_at?: string | null;
};
