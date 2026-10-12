import { StudentProfilePage } from "@/features/students/profile/student-profile-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <StudentProfilePage id={id} />;
}
