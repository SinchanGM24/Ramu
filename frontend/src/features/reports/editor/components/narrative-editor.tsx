import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { ReportArea } from "../types";

type NarrativeEditorProps = {
	area: ReportArea;
	complete: boolean;
	editable: boolean;
	reportId: string;
	refresh: () => void;
};

export function NarrativeEditor({
	area,
	complete,
	editable,
	reportId,
	refresh,
}: NarrativeEditorProps) {
	const [value, setValue] = useState(area.narrative || "");
	const [state, setState] = useState("saved");
	const [confirmReplacement, setConfirmReplacement] = useState(false);
	const [warnings, setWarnings] = useState<string[]>([]);
	const saved = useRef(area.narrative || "");
	const generated = useRef(false);

	useEffect(() => {
		setValue(area.narrative || "");
		saved.current = area.narrative || "";
	}, [area.id, area.narrative]);

	async function persist(text: string) {
		if (!editable || text === saved.current) return;
		setState("saving");
		try {
			await api(`/reports/${reportId}/workspace/narratives/${area.id}`, {
				method: "PUT",
				body: JSON.stringify({ content: text }),
			});
			saved.current = text;
			setState("saved");
			refresh();
		} catch {
			setState("error");
		}
	}

	async function generate(replaceExisting = false) {
		if (!editable || !complete) return;
		if (value.trim() && !replaceExisting) {
			setConfirmReplacement(true);
			return;
		}
		setConfirmReplacement(false);
		setState("saving");
		try {
			const result = await api<{ content: string; generation: { warnings: string[] } }>(
				`/reports/${reportId}/workspace/narratives/${area.id}/generate`,
				{ method: "POST" },
			);
			generated.current = true;
			saved.current = result.content;
			setValue(result.content);
			setWarnings(result.generation.warnings);
			setState("saved");
			refresh();
		} catch {
			setState("error");
		}
	}

	useEffect(() => {
		if (complete && !area.narrative && !generated.current) void generate();
	}, [complete, area.narrative]);

	return (
		<div className="mt-5">
			<div className="flex justify-between gap-2">
				<b className="text-sm">Narasi perkembangan</b>
				<Button
					type="button"
					variant="secondary"
					disabled={!editable || !complete || state === "saving"}
					onClick={() => void generate()}
				>
					<Sparkles className="mr-1 size-4" />
					Buat draf dari nilai
				</Button>
			</div>
			{area.narrativeStale && (
				<p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
					Nilai indikator telah berubah setelah draf otomatis dibuat. Tinjau narasi ini atau buat
					draf baru.
				</p>
			)}
			{warnings.map((warning) => (
				<p key={warning} className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
					{warning}
				</p>
			))}
			<textarea
				value={value}
				disabled={!editable}
				onChange={(event) => setValue(event.target.value)}
				onBlur={() => void persist(value)}
				className="mt-2 min-h-32 w-full rounded-xl border p-3 text-sm"
				placeholder="Lengkapi semua indikator untuk membuat draf otomatis."
			/>
			<ConfirmationDialog
				open={confirmReplacement}
				title="Ganti narasi yang sudah ada?"
				description="Draf baru dari nilai akan menggantikan teks yang telah Anda tulis."
				confirmLabel="Ganti dengan draf baru"
				onCancel={() => setConfirmReplacement(false)}
				onConfirm={() => void generate(true)}
			/>
			<p className={`mt-2 text-xs ${state === "error" ? "text-red-700" : "text-slate-500"}`}>
				{state === "saving"
					? "Menyusun draf…"
					: state === "error"
						? "Perubahan belum tersimpan. Coba lagi."
						: "Draf memakai nilai indikator dan tetap dapat diedit guru."}
			</p>
		</div>
	);
}
