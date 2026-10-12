import { Button } from "@/components/ui/button";
import type { LifecycleMode } from "../types";
export function SelectedStudentsActionBar({
	count,
	mode,
	onClear,
	onOpen,
}: {
	count: number;
	mode: LifecycleMode;
	onClear: () => void;
	onOpen: () => void;
}) {
	if (!count) return null;
	return (
		<div className="sticky bottom-4 z-20 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-lg">
			<p className="text-sm font-medium">{count} murid dipilih</p>
			<div className="flex gap-2">
				<Button variant="ghost" onClick={onClear}>
					Batalkan pilihan
				</Button>
				<Button onClick={onOpen}>
					{mode === "transfer" ? "Atur perpindahan" : "Tinjau kelulusan"}
				</Button>
			</div>
		</div>
	);
}
