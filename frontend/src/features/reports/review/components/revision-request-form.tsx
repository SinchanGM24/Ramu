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
		<div className="mt-5 border-t border-[#e7e9df] pt-5">
			<label className="block text-sm font-semibold text-[#35443a]">
				Catatan revisi
				<textarea
					value={note}
					onChange={(event) => onNoteChange(event.target.value)}
					maxLength={1000}
					className="mt-2 min-h-24 w-full rounded-xl border border-[#dfe3d9] bg-[#fffefa] p-3 text-sm text-[#17251b] outline-none transition placeholder:text-[#899188] focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
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
