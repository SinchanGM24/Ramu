import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export function LifecycleHeader({ isTeacher }: { isTeacher: boolean }) {
	return (
		<PageHeader
			eyebrow="Manajemen siswa"
			title="Perpindahan & Kelulusan"
			description={
				isTeacher
					? "Ajukan perpindahan atau kelulusan murid kelas Anda untuk disetujui Kepala Sekolah."
					: "Pilih murid terlebih dahulu, lalu tinjau tindakan administratif secara terpisah."
			}
			action={
				<Link href="/app/academic/archive">
					<Button variant="secondary">Lihat Arsip</Button>
				</Link>
			}
		/>
	);
}
