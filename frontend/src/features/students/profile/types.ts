export type Guardian = {
	id: string;
	name: string;
	relationship: string;
	phone: string;
	occupation?: string | null;
	is_primary: boolean;
	is_delivery_recipient?: boolean;
};

export type Enrollment = {
	id: string;
	academic_year_name: string;
	class_name?: string;
	status: string;
};

export type PublishedReport = {
	id: string;
	academic_year_name: string;
	semester_name: string;
	version_number: number;
	published_at: string;
};

export type StudentProfile = {
	id: string;
	name: string;
	student_number?: string | null;
	birth_date?: string | null;
	birth_place?: string | null;
	nickname?: string | null;
	gender?: "MALE" | "FEMALE" | null;
	religion?: string | null;
	child_order?: number | null;
	address?: string | null;
	guardians: Guardian[];
	enrollments?: Enrollment[];
	publishedReports?: PublishedReport[];
};
