import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { GuardianDialog } from "./guardian-dialog";
import type { Guardian } from "../types";

type GuardiansSectionProps = { guardians: Guardian[]; studentId: string };

export function GuardiansSection({ guardians, studentId }: GuardiansSectionProps) {
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState<Guardian | null>(null);
	const [adding, setAdding] = useState(false);
	const [notice, setNotice] = useState("");
	const close = () => {
		setAdding(false);
		setEditing(null);
	};
	const save = useMutation({
		mutationFn: ({ guardianId, body }: { guardianId?: string; body: unknown }) =>
			api(
				guardianId
					? `/students/${studentId}/guardians/${guardianId}`
					: `/students/${studentId}/guardians`,
				{ method: guardianId ? "PATCH" : "POST", body: JSON.stringify(body) },
			),
		onSuccess: () => {
			setNotice("Data orang tua/wali tersimpan.");
			close();
			queryClient.invalidateQueries({ queryKey: ["student", studentId] });
		},
		onError: (error) =>
			setNotice(error instanceof Error ? error.message : "Data orang tua/wali belum tersimpan."),
	});

	return (
		<Card>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-bold tracking-[-0.02em] text-brand-950">Orang tua/wali</h2>
					<p className="mt-1 text-sm leading-6 text-[#637065]">
						Tandai kontak yang menerima rapor saat diterbitkan.
					</p>
				</div>
				<Button
					variant="secondary"
					onClick={() => {
						setAdding(true);
						setEditing(null);
					}}
				>
					<Plus className="mr-1 size-4" />
					Tambah kontak
				</Button>
			</div>
			{notice ? (
				<p className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">{notice}</p>
			) : null}
			<div className="mt-4 space-y-3">
				{guardians.length ? (
					guardians.map((guardian) => (
						<button
							type="button"
							key={guardian.id}
							onClick={() => {
								setEditing(guardian);
								setAdding(false);
							}}
							className="flex w-full items-center justify-between rounded-2xl border border-[#e2e4da] bg-[#fdfdf9] p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
						>
							<span>
								<span className="block font-semibold text-brand-950">
									{guardian.name}
									{guardian.is_primary ? (
										<span className="ml-2 rounded-full bg-brand-50 px-2 py-1 text-xs text-brand-700">
											Kontak utama
										</span>
									) : null}
									{guardian.is_delivery_recipient !== false ? (
										<span className="ml-2 rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
											Penerima rapor
										</span>
									) : null}
								</span>
								<span className="mt-1 block text-sm text-[#637065]">
									{guardian.relationship} · {guardian.phone}
									{guardian.occupation ? ` · ${guardian.occupation}` : ""}
								</span>
							</span>
							<span className="text-sm font-semibold text-brand-700">Ubah</span>
						</button>
					))
				) : (
					<p className="rounded-xl bg-[#f7f7f1] p-4 text-sm text-[#637065]">
						Belum ada data orang tua/wali.
					</p>
				)}
			</div>
			{adding || editing ? (
				<GuardianDialog
					key={editing?.id ?? "baru"}
					guardian={editing}
					pending={save.isPending}
					onClose={close}
					onSubmit={(body) => save.mutate({ guardianId: editing?.id, body })}
				/>
			) : null}
		</Card>
	);
}
