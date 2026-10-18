const reportId = "demo-report";
const studentId = "demo-student";
const semesterId = "demo-semester";
const academicYearId = "demo-year";
let reviewStatus: "SUBMITTED" | "IN_REVIEW" | "APPROVED" = "SUBMITTED";

const demoSession = {
	userId: "demo-admin",
	schoolId: "demo-school",
	role: "SCHOOL_ADMIN" as const,
	email: "admin@tkcontohceria.id",
};

const classGroups = [
	{ id: "demo-group-apel", name: "Kelas Apel", is_active: true },
	{ id: "demo-group-melati", name: "Kelas Melati", is_active: true },
	{ id: "demo-group-merpati", name: "Kelas Merpati", is_active: true },
];

const activeStudents = [
	{
		id: studentId,
		name: "Alya Putri",
		student_number: "TK-2026-014",
		class_name: "Kelas Apel",
		lifecycle_status: "ACTIVE" as const,
	},
	{
		id: "demo-student-2",
		name: "Bima Pratama",
		student_number: "TK-2026-021",
		class_name: "Kelas Melati",
		lifecycle_status: "ACTIVE" as const,
	},
	{
		id: "demo-student-3",
		name: "Citra Lestari",
		student_number: "TK-2026-028",
		class_name: "Kelas Merpati",
		lifecycle_status: "ACTIVE" as const,
	},
];

const archivedStudents = [
	{
		id: "demo-archived-student",
		name: "Dimas Pratama",
		student_number: "TK-2024-003",
		class_name: "Kelas Apel",
		lifecycle_status: "GRADUATED" as const,
	},
];

const scales = [
	{ id: "scale-bb", code: "BB", label: "Belum Berkembang" },
	{ id: "scale-mb", code: "MB", label: "Mulai Berkembang" },
	{ id: "scale-bsh", code: "BSH", label: "Berkembang Sesuai Harapan" },
	{ id: "scale-bsb", code: "BSB", label: "Berkembang Sangat Baik" },
];

const workspace = {
	report: {
		student_name: "Alya Putri",
		student_number: "TK-2026-014",
		class_name: "Kelas Apel",
		semester_name: "Semester I",
		academic_year_name: "2026",
		status: "DRAFT",
	},
	scales,
	areas: [
		{
			id: "area-moral",
			name: "Nilai-Nilai Agama dan Moral",
			narrative: "Alya mengikuti kegiatan doa bersama dengan tertib dan mandiri.",
			subAreas: [
				{
					id: "sub-area-moral",
					name: "Pembiasaan",
					indicators: [
						{
							id: "indicator-moral",
							description: "Mengikuti kegiatan doa bersama",
							scaleOptionId: "scale-bsh",
						},
					],
				},
			],
		},
		{
			id: "area-fisik-motorik",
			name: "Fisik Motorik",
			narrative: "Alya bergerak lincah saat kegiatan luar ruang dan teliti saat berkarya.",
			subAreas: [
				{
					id: "sub-area-fisik-motorik",
					name: "Motorik Kasar dan Halus",
					indicators: [
						{
							id: "indicator-fisik-motorik",
							description: "Mengkoordinasikan gerakan tubuh saat bermain",
							scaleOptionId: "scale-bsh",
						},
					],
				},
			],
		},
		{
			id: "area-kognitif",
			name: "Kognitif",
			narrative:
				"Alya mampu membandingkan benda dan mencoba beberapa cara saat memecahkan masalah.",
			subAreas: [
				{
					id: "sub-area-kognitif",
					name: "Berpikir Logis",
					indicators: [
						{
							id: "indicator-kognitif",
							description: "Mengelompokkan benda berdasarkan warna dan bentuk",
							scaleOptionId: "scale-bsh",
						},
					],
				},
			],
		},
		{
			id: "area-bahasa",
			name: "Bahasa",
			narrative: "Alya mampu menyampaikan pengalaman sederhana dengan percaya diri.",
			subAreas: [
				{
					id: "sub-area-bahasa",
					name: "Komunikasi",
					indicators: [
						{
							id: "indicator-bahasa",
							description: "Menceritakan kembali kegiatan yang dialami",
							scaleOptionId: "scale-bsb",
						},
					],
				},
			],
		},
		{
			id: "area-sosem",
			name: "Sosial Emosional",
			narrative:
				"Alya mampu menunggu giliran dan menunjukkan kepedulian kepada teman saat bermain bersama.",
			subAreas: [
				{
					id: "sub-area-sosem",
					name: "Perilaku Prososial",
					indicators: [
						{
							id: "indicator-sosem",
							description: "Mau berbagi dan bekerja sama dengan teman",
							scaleOptionId: "scale-bsb",
						},
					],
				},
			],
		},
		{
			id: "area-seni",
			name: "Seni",
			narrative:
				"Alya menikmati kegiatan musik dan mampu mengekspresikan gagasan melalui karya sederhana.",
			subAreas: [
				{
					id: "sub-area-seni",
					name: "Ekspresi dan Karya Seni",
					indicators: [
						{
							id: "indicator-seni",
							description: "Membuat karya seni dengan berbagai bahan",
							scaleOptionId: "scale-bsb",
						},
					],
				},
			],
		},
	],
	growth: { weight_kg: 18.5, height_cm: 108, head_circumference_cm: null },
	attendance: { sick_days: 1, permission_days: 0, unexcused_days: 0 },
};

const preview = {
	report: {
		student_name: "Alya Putri",
		student_number: "TK-2026-014",
		semester_name: "Semester I",
	},
	areas: workspace.areas.map(({ id, name, narrative }) => ({ id, name, narrative })),
	assessments: workspace.areas.flatMap((area) =>
		area.subAreas.flatMap((subArea) =>
			subArea.indicators.map((indicator) => ({
				area_id: area.id,
				sub_area_name: subArea.name,
				description: indicator.description,
				scale_code: scales.find((scale) => scale.id === indicator.scaleOptionId)?.code ?? null,
			})),
		),
	),
};

const publishedVersion = {
	current_status: "DRAFT",
	id: "demo-version-1",
	version_number: 1,
	published_at: "2026-10-01T08:00:00.000Z",
	snapshot: {
		school: { name: "TK Contoh Ceria", address: "Kota Contoh", logo_storage_key: null },
		student: { name: "Alya Putri", student_number: "TK-2026-014", class_name: "Kelas Apel" },
		semester: { name: "Semester I", academic_year_name: "2026" },
		assessments: preview.assessments.map((item) => ({
			area_name: workspace.areas.find((area) => area.id === item.area_id)?.name ?? "-",
			sub_area_name: item.sub_area_name,
			description: item.description,
			code: item.scale_code,
		})),
		narratives: workspace.areas.map((area) => ({ name: area.name, content: area.narrative })),
		growth: workspace.growth,
		attendance: workspace.attendance,
	},
};

const deliveries = [
	{
		id: "delivery-1",
		guardian_name: "Ibu Sari",
		relationship: "Ibu",
		recipient_phone: "0812-0000-0000",
		version_number: 1,
		status: "SENT" as const,
		queued_at: "2026-10-02T08:00:00.000Z",
		whatsapp_opened_at: "2026-10-02T08:01:00.000Z",
		attempt_count: 1,
		failure_reason: null,
	},
];

function page<T>(items: T[]) {
	return { items, total: items.length, page: 1, limit: 10 };
}

export function demoResponse(path: string, options: RequestInit): unknown {
	const request = new URL(path, "https://demo.ramu.local");
	const pathname = request.pathname;
	const method = options.method ?? "GET";

	if (pathname === "/auth/login" && method === "POST") return demoSession;
	if (pathname === "/auth/logout" && method === "POST") return undefined;
	if (pathname === "/auth/session") return demoSession;
	if (pathname === "/auth/profile") {
		return {
			id: demoSession.userId,
			name: "Admin Sekolah",
			email: demoSession.email,
			phone: "0812-0000-0000",
			role: demoSession.role,
		};
	}
	if (pathname === "/dashboard/summary") {
		return {
			role: demoSession.role,
			schoolName: "TK Contoh Ceria",
			academicYearName: "2026",
			semesterName: "Semester I",
			stats: [
				{
					id: "students",
					label: "Murid aktif",
					value: 60,
					description: "Terdaftar pada semester aktif",
					href: "/app/academic/students",
				},
				{
					id: "reports",
					label: "Raport berjalan",
					value: 42,
					description: "Sedang diisi atau ditinjau",
					href: "/app/reports/progress",
				},
				{
					id: "classes",
					label: "Kelas aktif",
					value: 3,
					description: "Kelas pada tahun ajaran ini",
					href: "/app/academic",
				},
			],
		};
	}

	if (pathname === "/schools/current/logo" && method === "POST") {
		return {
			id: "demo-school",
			name: "TK Contoh Ceria",
			address: "Kota Contoh",
			phone: "0812-0000-0000",
			has_logo: false,
		};
	}
	if (pathname === "/schools/current") {
		const data = typeof options.body === "string" ? JSON.parse(options.body) : {};
		return {
			id: "demo-school",
			name: data.name || "TK Contoh Ceria",
			address: data.address || "Kota Contoh",
			phone: data.phone || "0812-0000-0000",
			has_logo: false,
		};
	}

	if (pathname === "/academic/semesters") {
		return [
			{
				id: semesterId,
				name: "Semester I",
				academic_year_id: academicYearId,
				academic_year_name: "2026",
				is_active: true,
			},
		];
	}
	if (pathname === "/academic/active-semester") {
		return {
			id: semesterId,
			name: "Semester I",
			academic_year_id: academicYearId,
			academic_year_name: "2026",
			is_active: true,
		};
	}
	if (pathname === "/academic/years")
		return [{ id: academicYearId, name: "2026", is_active: true }];
	if (pathname === "/academic/class-groups") return classGroups;
	if (pathname === "/academic/class-periods") {
		return classGroups.map((group, index) => ({
			id: `demo-class-${index + 1}`,
			class_group_id: group.id,
			name: group.name,
			is_active: true,
			academic_year_name: "2026",
			teacher_names: index === 0 ? "Guru Aisyah, Guru Budi" : "Guru Citra",
			student_count: 20,
		}));
	}
	if (pathname === "/academic/enrollments") {
		return activeStudents.map((student) => ({
			id: `enrollment-${student.id}`,
			student_name: student.name,
			class_name: student.class_name,
		}));
	}

	if (pathname.match(/^\/staff\/class-periods\/[^/]+\/assignments$/)) {
		return [
			{ id: "assignment-1", teacher_name: "Guru Aisyah", teacher_user_id: "demo-teacher" },
			{ id: "assignment-2", teacher_name: "Guru Budi", teacher_user_id: "demo-teacher-2" },
		];
	}
	if (pathname === "/staff") {
		return {
			items: [
				{
					id: "demo-teacher",
					name: "Guru Aisyah",
					email: "guru.aisyah@ramu.test",
					phone: "0812-0000-0001",
					role: "TEACHER",
					is_active: true,
				},
				{
					id: "demo-teacher-2",
					name: "Guru Budi",
					email: "guru.budi@ramu.test",
					phone: "0812-0000-0002",
					role: "TEACHER",
					is_active: true,
				},
				{
					id: "demo-principal",
					name: "Kepala Sekolah",
					email: "kepsek@ramu.test",
					phone: "0812-0000-0003",
					role: "PRINCIPAL",
					is_active: true,
				},
			],
			total: 3,
			page: 1,
		};
	}

	if (pathname === "/students/requests") return [];
	if (pathname === `/students/${studentId}`) {
		return {
			id: studentId,
			name: "Alya Putri",
			student_number: "TK-2026-014",
			nickname: "Alya",
			gender: "FEMALE",
			birth_place: "Bandung",
			birth_date: "2021-04-14",
			religion: "Islam",
			child_order: 1,
			address: "Jl. Melati No. 12, Kota Contoh",
			guardians: [
				{
					id: "guardian-1",
					name: "Sari Wulandari",
					relationship: "Ibu",
					phone: "0812-0000-0000",
					occupation: "Wiraswasta",
					is_primary: true,
					is_delivery_recipient: true,
				},
			],
			enrollments: [
				{
					id: "enrollment-1",
					academic_year_name: "2026",
					class_name: "Kelas Apel",
					status: "ACTIVE",
				},
			],
			publishedReports: [
				{
					id: reportId,
					academic_year_name: "2026",
					semester_name: "Semester I",
					version_number: 1,
					published_at: "2026-10-01T08:00:00.000Z",
				},
			],
		};
	}
	if (pathname === "/students") {
		const archived = request.searchParams.get("lifecycleStatus") === "GRADUATED";
		return archived ? page(archivedStudents) : page(activeStudents);
	}

	if (pathname === "/lifecycle/history") {
		return page([
			{
				id: "history-1",
				student_id: "demo-archived-student",
				student_name: "Dimas Pratama",
				action: "GRADUATED",
				effective_on: "2026-06-20",
				reason: "Menyelesaikan pendidikan PAUD.",
			},
		]);
	}
	if (pathname === "/lifecycle/proposals") return [];

	if (pathname === `/reports/${reportId}/workspace`) return workspace;
	if (pathname === `/reports/${reportId}/editor`) return preview;
	if (pathname === `/reports/${reportId}/published-version`) return publishedVersion;
	if (pathname === `/reports/${reportId}/completeness`) {
		return {
			complete: true,
			missingAssessments: [],
			missingNarratives: [],
			missingSemesterData: false,
		};
	}
	if (pathname === `/reports/${reportId}/portfolio`) {
		return [
			{
				id: "portfolio-1",
				original_filename: "kegiatan-seni.jpg",
				content_type: "image/jpeg",
				byte_size: 245000,
				caption: "Membuat karya kolase bersama teman.",
				included_in_report: true,
				created_at: "2026-09-20T08:00:00.000Z",
			},
		];
	}
	if (pathname === `/reports/${reportId}/extracurricular`) {
		return [{ id: "extra-1", activity_name: "Menari", grade: "A" }];
	}
	if (pathname === `/reports/${reportId}/delivery-recipients`) {
		return [
			{
				id: "guardian-1",
				name: "Sari Wulandari",
				relationship: "Ibu",
				phone: "0812-0000-0000",
				is_primary: true,
				student_lifecycle_status: "ACTIVE",
			},
		];
	}
	if (pathname === `/reports/${reportId}/delivery-context`) return { studentId };
	if (pathname === `/reports/${reportId}/deliveries`) return deliveries;
	if (pathname === "/reports/review-queue") {
		return [
			{
				id: reportId,
				status: reviewStatus,
				submitted_at: "2026-10-01T08:00:00.000Z",
				student_name: "Alya Putri",
				semester_name: "Semester I",
			},
		];
	}
	if (pathname === "/reports/publishable-ids") return [reportId];
	if (pathname === "/reports/publication-jobs") {
		return {
			id: "demo-publication-job",
			status: "COMPLETED",
			total_count: 1,
			completed_count: 1,
			failed_count: 0,
		};
	}
	if (pathname.startsWith("/reports/publication-jobs/")) {
		return {
			id: pathname.split("/").at(-1),
			status: "COMPLETED",
			total_count: 1,
			completed_count: 1,
			failed_count: 0,
		};
	}
	if (pathname === "/reports/progress") {
		const publication = request.searchParams.get("view") === "PUBLICATION";
		const items = publication
			? [
					{
						id: studentId,
						name: "Alya Putri",
						report_id: reportId,
						status: "APPROVED",
						delivery_status: null,
						latest_published_version_number: null,
					},
				]
			: activeStudents.map((student, index) => ({
					id: student.id,
					name: student.name,
					report_id: index === 0 ? reportId : null,
					status: index === 0 ? "DRAFT" : null,
					completion_percent: index === 0 ? 82 : 0,
				}));
		return {
			items,
			total: items.length,
			page: 1,
			limit: 10,
			summary: publication
				? { waitingReview: 0, approved: 1, published: 0, correction: 0 }
				: { total: items.length, notCreated: 2, draft: 1, review: 0, publish: 0, published: 0 },
		};
	}

	if (pathname.startsWith("/assessment/students/")) {
		return {
			student: { id: studentId, name: "Alya Putri" },
			scales,
			indicators: [
				{
					id: "indicator-moral",
					area_name: "Nilai Agama dan Moral",
					description: "Mengikuti kegiatan doa bersama",
					scale_option_id: "scale-bsh",
				},
			],
		};
	}

	if (pathname === "/parent/verify" && method === "POST") {
		return { expiresAt: "2026-10-07T12:00:00.000Z" };
	}
	if (pathname === "/parent/report") {
		return {
			report: {
				student: {
					name: "Alya Putri",
					nickname: "Alya",
					student_number: "TK-2026-014",
					class_name: "Kelas Apel",
				},
				semester: { name: "Semester I", academic_year_name: "2026" },
				assessments: publishedVersion.snapshot.assessments,
				narratives: workspace.areas.map((area) => ({ name: area.name, content: area.narrative })),
				growth: workspace.growth,
				attendance: workspace.attendance,
				extracurricular: [{ activity_name: "Menari", grade: "A" }],
			},
		};
	}

	if (pathname.includes("/transition") && method === "POST") {
		const body = typeof options.body === "string" ? JSON.parse(options.body) : {};
		if (body.action === "review") reviewStatus = "IN_REVIEW";
		if (body.action === "approve") reviewStatus = "APPROVED";
		if (body.action === "revision") reviewStatus = "SUBMITTED";
		return { id: reportId, status: reviewStatus };
	}
	if (pathname.includes("/publish") && method === "POST") {
		return { parentAccess: { link: "/r/demo-parent", pin: "123456" } };
	}
	if (pathname.includes("open-whatsapp") || pathname.includes("regenerate-access")) {
		return { whatsAppUrl: "https://wa.me/628120000000?text=Raport%20Alya%20Putri" };
	}
	if (method !== "GET") return { id: reportId, status: "DRAFT" };

	return {};
}
