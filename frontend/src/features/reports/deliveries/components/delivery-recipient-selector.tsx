import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Recipient } from "../types";

type DeliveryRecipientSelectorProps = {
	pending: boolean;
	recipients: Recipient[];
	selectedIds: string[];
	onQueue: () => void;
	onToggleAll: () => void;
	onToggleRecipient: (id: string) => void;
};

export function DeliveryRecipientSelector({
	pending,
	recipients,
	selectedIds,
	onQueue,
	onToggleAll,
	onToggleRecipient,
}: DeliveryRecipientSelectorProps) {
	return (
		<Card className="mb-5">
			<div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h2 className="font-bold text-slate-900">Pilih penerima</h2>
					<p className="mt-1 text-sm text-slate-500">
						Hanya kontak yang ditandai sebagai penerima rapor pada profil murid yang muncul di sini.
					</p>
				</div>
				{recipients.length ? (
					<button
						type="button"
						onClick={onToggleAll}
						className="text-sm font-semibold text-brand-700 hover:text-brand-800"
					>
						{selectedIds.length === recipients.length ? "Batalkan semua" : "Pilih semua"}
					</button>
				) : null}
			</div>
			{recipients.length ? (
				<div className="mt-3 divide-y divide-slate-100">
					{recipients.map((recipient) => {
						const selected = selectedIds.includes(recipient.id);
						return (
							<button
								type="button"
								key={recipient.id}
								role="checkbox"
								aria-checked={selected}
								onClick={() => onToggleRecipient(recipient.id)}
								className={`flex w-full items-center gap-3 px-1 py-3 text-left ${selected ? "text-slate-900" : "text-slate-500"}`}
							>
								<span
									aria-hidden="true"
									className={`grid size-5 shrink-0 place-items-center rounded border ${selected ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white"}`}
								>
									{selected ? "✓" : null}
								</span>
								<span className="min-w-0 flex-1">
									<span className="font-semibold">
										{recipient.name}
										{recipient.is_primary ? (
											<span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
												Kontak utama
											</span>
										) : null}
									</span>
									<span className="mt-0.5 block text-sm text-slate-500">
										{recipient.relationship} · {recipient.phone}
									</span>
								</span>
							</button>
						);
					})}
				</div>
			) : (
				<div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
					Belum ada kontak wali yang ditandai sebagai penerima rapor. Kelola kontak wali pada profil
					murid terlebih dahulu.
				</div>
			)}
			<div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm text-slate-500">{selectedIds.length} kontak dipilih</p>
				<Button disabled={!selectedIds.length || pending} onClick={onQueue}>
					<Send className="mr-1.5 size-4" />
					{pending ? "Memasukkan ke antrean…" : "Masukkan ke antrean"}
				</Button>
			</div>
		</Card>
	);
}
