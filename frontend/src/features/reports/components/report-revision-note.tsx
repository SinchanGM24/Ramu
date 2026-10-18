import { MessageSquareWarning } from "lucide-react";

type ReportRevisionNoteProps = {
	compact?: boolean;
	note?: string | null;
};

export function ReportRevisionNote({ compact = false, note }: ReportRevisionNoteProps) {
	if (!note) return null;

	if (compact) {
		return (
			<p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-amber-800">
				<MessageSquareWarning className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
				<span>Catatan revisi: {note}</span>
			</p>
		);
	}

	return (
		<section className="mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
			<MessageSquareWarning className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
			<div>
				<h2 className="font-semibold">Catatan revisi dari Kepala Sekolah</h2>
				<p className="mt-1 leading-6">{note}</p>
			</div>
		</section>
	);
}
