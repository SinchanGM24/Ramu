import { Button } from "@/components/ui/button";

type RevisionRequestFormProps = {
	note: string;
	pending: boolean;
	onCancel: () => void;
	onNoteChange: (note: string) => void;
	onSubmit: () => void;
};

export function RevisionRequestForm({
	note,
	pending,
	onCancel,
	onNoteChange,
	onSubmit,
}: RevisionRequestFormProps) {
	return (
		<div className="mt-4 border-t border-slate-100 pt-4">
			<label className="block text-sm font-semibold text-slate-800">
				Catatan revisi
				<textarea
					value={note}
					onChange={(event) => onNoteChange(event.target.value)}
					maxLength={1000}
					className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-500"
					placeholder="Jelaskan bagian yang perlu diperbaiki…"
				/>
			</label>
			<div className="mt-3 flex gap-2">
				<Button variant="secondary" onClick={onCancel}>
					Batal
				</Button>
				<Button disabled={!note.trim() || pending} onClick={onSubmit}>
					Kirim permintaan revisi
				</Button>
			</div>
		</div>
	);
}
