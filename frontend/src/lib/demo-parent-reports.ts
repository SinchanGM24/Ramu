import type { ParentReport } from "@/features/reports/parent/types";

type AssessmentCode = "BB" | "MB" | "BSH" | "BSB";

export type DemoParentProfile = {
	reportId: string;
	token: string;
	pin: string;
	student: NonNullable<ParentReport["student"]>;
	semester: NonNullable<ParentReport["semester"]>;
	assessmentPattern: AssessmentCode[];
	narratives: Record<string, string>;
	growth: NonNullable<ParentReport["growth"]>;
	attendance: NonNullable<ParentReport["attendance"]>;
	extracurricular: NonNullable<ParentReport["extracurricular"]>;
};

/**
 * Data ini hanya digunakan oleh mode demo statis GitHub Pages. Narasi dibuat
 * mengikuti susunan bahasa Smart Narrative Engine agar contoh wali tetap
 * realistis, tanpa membawa proses atau data sekolah ke frontend publik.
 */
export const demoParentProfiles: DemoParentProfile[] = [
	{
		reportId: "demo-report-published-alya",
		token: "demo-parent",
		pin: "123456",
		student: {
			name: "Alya Putri",
			nickname: "Alya",
			student_number: "TK-2026-014",
			class_name: "Kelas Apel",
		},
		semester: { name: "Semester I", academic_year_name: "2026" },
		assessmentPattern: ["BSB", "BSH", "BSH", "BSH"],
		narratives: {
			"Nilai-Nilai Agama dan Moral":
				"Selama semester ini, Ananda Alya menunjukkan perkembangan yang sangat baik dalam membiasakan perilaku baik dan mengucapkan serta membalas salam. Kemampuannya dalam mengenal agama yang dianut dan mengucapkan doa dalam kegiatan sehari-hari juga telah berkembang sesuai harapan. Pembiasaan baik yang serupa dapat terus diberikan agar perkembangan Ananda Alya semakin mantap.",
			"Fisik Motorik":
				"Selama semester ini, Ananda Alya menunjukkan perkembangan yang sangat baik dalam melompat, meloncat, dan berlari secara terkoordinasi. Kemampuannya dalam mengoordinasikan mata dan tangan juga telah berkembang sesuai harapan. Kegiatan mencoba dan berkarya yang serupa dapat terus diberikan agar perkembangan Ananda Alya semakin mantap.",
			Kognitif:
				"Selama semester ini, Ananda Alya menunjukkan perkembangan yang sangat baik dalam mengamati benda dan gejala dengan rasa ingin tahu. Kemampuannya dalam mengenali dan mengulang pola juga telah berkembang sesuai harapan. Kesempatan mengamati dan mencoba yang serupa dapat terus diberikan agar perkembangan Ananda Alya semakin mantap.",
			Bahasa:
				"Selama semester ini, Ananda Alya menunjukkan perkembangan yang sangat baik dalam menceritakan kembali cerita yang didengar. Kemampuannya dalam memahami cerita yang dibacakan dan berpartisipasi dalam percakapan juga telah berkembang sesuai harapan. Percakapan dan kegiatan membaca yang serupa dapat terus diberikan agar perkembangan Ananda Alya semakin mantap.",
			"Sosial Emosional":
				"Selama semester ini, Ananda Alya menunjukkan perkembangan yang sangat baik dalam memilih kegiatan secara mandiri dan menunjukkan rasa empati. Kemampuannya dalam menaati aturan permainan juga telah berkembang sesuai harapan. Interaksi bersama yang serupa dapat terus diberikan agar perkembangan Ananda Alya semakin mantap.",
			Seni: "Selama semester ini, Ananda Alya menunjukkan perkembangan yang sangat baik dalam mengekspresikan gerak mengikuti irama. Kemampuannya dalam menggambar objek di sekitar juga telah berkembang sesuai harapan. Kegiatan berekspresi yang serupa dapat terus diberikan agar perkembangan Ananda Alya semakin mantap.",
		},
		growth: { weight_kg: 18.5, height_cm: 108 },
		attendance: { sick_days: 1, permission_days: 0, unexcused_days: 0 },
		extracurricular: [{ activity_name: "Menari", grade: "A" }],
	},
	{
		reportId: "demo-report-published-bima",
		token: "demo-parent-bima",
		pin: "246810",
		student: {
			name: "Bima Pratama",
			nickname: "Bima",
			student_number: "TK-2026-021",
			class_name: "Kelas Melati",
		},
		semester: { name: "Semester I", academic_year_name: "2026" },
		assessmentPattern: ["BSH", "BSH", "MB", "BSH", "MB"],
		narratives: {
			"Nilai-Nilai Agama dan Moral":
				"Perkembangan Ananda Bima dalam mengenal agama yang dianut dan mengucapkan doa dalam kegiatan sehari-hari telah berkembang sesuai harapan. Dalam pembiasaan nilai agama dan moral, Ananda Bima mulai menunjukkan kemampuan menirukan gerakan ibadah secara berurutan. Pembiasaan baik dan kegiatan ibadah yang sesuai tahap perkembangan anak dapat menjadi pembiasaan yang dilakukan bersama Ananda Bima.",
			"Fisik Motorik":
				"Perkembangan Ananda Bima dalam menirukan beragam gerakan dan memanfaatkan alat permainan luar ruang telah berkembang sesuai harapan. Dalam kegiatan motorik halus, Ananda Bima mulai menunjukkan kemampuan menjiplak bentuk sederhana. Kegiatan menggambar, menjiplak, dan berkarya dengan beragam media dapat menjadi kesempatan yang menyenangkan bagi Ananda Bima.",
			Kognitif:
				"Perkembangan Ananda Bima dalam mengenal fungsi benda di sekitarnya dan mengamati benda dan gejala dengan rasa ingin tahu telah berkembang sesuai harapan. Pada kegiatan menemukan dan memecahkan masalah sederhana, Ananda Bima mulai menunjukkan kemampuan mengenal pola kegiatan dan waktu. Permainan mengelompokkan benda, menyusun pola, dan mencari cara sederhana dapat menjadi kegiatan yang dapat dilakukan bersama Ananda Bima.",
			Bahasa:
				"Perkembangan Ananda Bima dalam menyimak perkataan orang lain dan menjawab pertanyaan sesuai konteks telah berkembang sesuai harapan. Dalam kegiatan berbahasa dan bercakap-cakap, Ananda Bima mulai menunjukkan kemampuan menceritakan kembali cerita yang didengar. Kegiatan bercerita, bercakap-cakap, dan membaca bersama dapat menjadi kesempatan untuk mendampingi Ananda Bima.",
			"Sosial Emosional":
				"Perkembangan Ananda Bima dalam memilih kegiatan secara mandiri dan berbagi, menolong, dan membantu teman telah berkembang sesuai harapan. Pada kegiatan bermain bersama, Ananda Bima mulai menunjukkan kemampuan menaati aturan permainan. Kegiatan bermain bersama yang menumbuhkan kemandirian, empati, dan kerja sama dapat menjadi kesempatan untuk menemani Ananda Bima.",
			Seni: "Perkembangan Ananda Bima dalam menikmati musik atau lagu kesukaannya dan menggambar objek di sekitar telah berkembang sesuai harapan. Dalam kegiatan berekspresi melalui seni, Ananda Bima mulai menunjukkan kemampuan bernyanyi secara mandiri. Kegiatan bernyanyi, bergerak mengikuti irama, dan berkarya seni dapat menjadi kegiatan yang menyenangkan bagi Ananda Bima.",
		},
		growth: { weight_kg: 19.2, height_cm: 110 },
		attendance: { sick_days: 2, permission_days: 1, unexcused_days: 0 },
		extracurricular: [{ activity_name: "Futsal", grade: "B" }],
	},
	{
		reportId: "demo-report-published-citra",
		token: "demo-parent-citra",
		pin: "135791",
		student: {
			name: "Citra Lestari",
			nickname: "Citra",
			student_number: "TK-2026-028",
			class_name: "Kelas Merpati",
		},
		semester: { name: "Semester I", academic_year_name: "2026" },
		assessmentPattern: ["MB", "MB", "BSH", "BB", "MB"],
		narratives: {
			"Nilai-Nilai Agama dan Moral":
				"Pada aspek nilai-nilai agama dan moral, Ananda Citra sedang menikmati proses bertumbuh melalui pembiasaan dan teladan sehari-hari. Dalam pembiasaan nilai agama dan moral, Ananda Citra mulai menunjukkan kemampuan mengucapkan doa dalam kegiatan sehari-hari. Adapun kemampuan menirukan gerakan ibadah secara berurutan masih membutuhkan dukungan dan pendampingan melalui pembiasaan dan teladan yang dilakukan secara konsisten. Untuk mendukung perkembangannya, pembiasaan baik dan kegiatan ibadah yang sesuai tahap perkembangan anak dapat menjadi pembiasaan yang dilakukan bersama Ananda Citra.",
			"Fisik Motorik":
				"Perkembangan Ananda Citra dalam menjiplak bentuk sederhana telah berkembang sesuai harapan. Dalam kegiatan gerak tubuh, Ananda Citra mulai menunjukkan kemampuan melempar benda ke arah tujuan. Adapun kemampuan menangkap benda dengan tepat masih membutuhkan dukungan dan pendampingan melalui pengalaman bermain yang menyenangkan. Berbagai permainan gerak seperti melompat, berlari, dan bermain bola dapat menjadi pilihan kegiatan yang menyenangkan bagi Ananda Citra.",
			Kognitif:
				"Perkembangan Ananda Citra dalam mengenal konsep bilangan telah berkembang sesuai harapan. Pada kegiatan menemukan dan memecahkan masalah sederhana, Ananda Citra mulai menunjukkan kemampuan mengenal konsep sederhana sehari-hari. Adapun kemampuan mengenali hubungan sebab dan akibat masih membutuhkan dukungan dan pendampingan melalui kesempatan mengamati, mencoba, dan menemukan. Permainan mengelompokkan benda, menyusun pola, dan mencari cara sederhana dapat menjadi kegiatan yang dapat dilakukan bersama Ananda Citra.",
			Bahasa:
				"Perkembangan Ananda Citra dalam memahami cerita yang dibacakan telah berkembang sesuai harapan. Dalam kegiatan berbahasa dan bercakap-cakap, Ananda Citra mulai menunjukkan kemampuan mengulang kalimat sederhana. Adapun kemampuan bertanya dengan kalimat yang tepat masih membutuhkan dukungan dan pendampingan melalui percakapan, cerita, dan pendampingan yang hangat. Kegiatan bercerita, bercakap-cakap, dan membaca bersama dapat menjadi kesempatan untuk mendampingi Ananda Citra.",
			"Sosial Emosional":
				"Perkembangan Ananda Citra dalam menunjukkan rasa percaya diri telah berkembang sesuai harapan. Pada kegiatan yang menumbuhkan kesadaran diri, Ananda Citra mulai menunjukkan kemampuan mengendalikan perasaan. Adapun kemampuan menaati aturan permainan masih membutuhkan dukungan dan pendampingan melalui kegiatan bersama dan pendampingan yang hangat. Kegiatan bermain bersama yang menumbuhkan kemandirian, empati, dan kerja sama dapat menjadi kesempatan untuk menemani Ananda Citra.",
			Seni: "Perkembangan Ananda Citra dalam menggambar objek di sekitar telah berkembang sesuai harapan. Dalam kegiatan menikmati bunyi dan irama, Ananda Citra mulai menunjukkan kemampuan menikmati musik atau lagu kesukaannya. Adapun kemampuan menggunakan imajinasi dalam bermain peran masih membutuhkan dukungan dan pendampingan melalui kesempatan berekspresi dengan beragam kegiatan seni. Kegiatan bernyanyi, bergerak mengikuti irama, dan berkarya seni dapat menjadi kegiatan yang menyenangkan bagi Ananda Citra.",
		},
		growth: { weight_kg: 17.8, height_cm: 106 },
		attendance: { sick_days: 0, permission_days: 2, unexcused_days: 1 },
		extracurricular: [{ activity_name: "Menggambar", grade: "A" }],
	},
];

export function demoParentProfileByToken(token: string) {
	return demoParentProfiles.find((profile) => profile.token === token);
}
