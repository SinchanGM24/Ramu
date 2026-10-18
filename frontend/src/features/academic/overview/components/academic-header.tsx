import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export function AcademicHeader({ onAddYear }: { onAddYear: () => void }) {
	return (
		<PageHeader
			eyebrow="Akademik"
			title="Kelas dan tahun ajaran"
			description="Tentukan konteks tahun ajaran, lalu siapkan kelas dan penugasan guru."
			action={
				<Button variant="secondary" onClick={onAddYear}>
					<CalendarDays size={16} />
					Tambah tahun ajaran
				</Button>
			}
		/>
	);
}
