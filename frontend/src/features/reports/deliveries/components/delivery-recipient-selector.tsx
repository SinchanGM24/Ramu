import Link from "next/link";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Recipient } from "../types";

type DeliveryRecipientSelectorProps = {
	pending: boolean;
	recipients: Recipient[];
	reportId: string;
	selectedIds: string[];
	onOpenWhatsApp: () => void;
	studentId?: string;
	onToggleAll: () => void;
	onToggleRecipient: (id: string) => void;
};

export function DeliveryRecipientSelector({
	pending,
	recipients,
	selectedIds,
	onOpenWhatsApp,
	reportId,
	studentId,
	onToggleAll,
	onToggleRecipient,
}: DeliveryRecipientSelectorProps) {
	const isArchived = recipients.some(
		(recipient) => recipient.student_lifecycle_status === "GRADUATED",
	);

	return (
		<Card className="mb-5 border-[#e5e7dc] bg-[#fffefa]">
			<div className="flex flex-col gap-3 border-b border-[#e7e9df] pb-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h2 className="font-bold text-[#17251b]">Pilih penerima</h2>
					<p className="mt-1 text-sm leading-6 text-[#637065]">
						Hanya kontak yang ditandai sebagai penerima raport pada profil murid yang muncul di
						sini.
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
			{isArchived ? (
				<p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
					Murid ini berada di Arsip. Raport yang telah diterbitkan tetap dapat dibagikan kepada
					wali.
				</p>
			) : null}
			{recipients.length ? (
				<div className="mt-3 divide-y divide-[#edf0e8]">
					{recipients.map((recipient) => {
						const selected = selectedIds.includes(recipient.id);
						return (
							<button
								type="button"
								key={recipient.id}
								role="checkbox"
								aria-checked={selected}
								onClick={() => onToggleRecipient(recipient.id)}
								className={`flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-[#f5f7f1] ${selected ? "text-[#17251b]" : "text-[#637065]"}`}
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
					<p>
						Belum ada kontak wali yang ditandai sebagai penerima raport. Kelola kontak wali pada
						profil murid terlebih dahulu.
					</p>
					{studentId ? (
						<Link
							href={`/app/academic/students/${studentId}?from=deliveries&reportId=${reportId}`}
							className="mt-3 inline-flex"
						>
							<Button variant="secondary">Kelola profil murid</Button>
						</Link>
					) : null}
				</div>
			)}
			<div className="mt-4 flex flex-col gap-2 border-t border-[#e7e9df] pt-4 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm text-[#637065]">{selectedIds.length} kontak dipilih</p>
				<Button disabled={!selectedIds.length || pending} onClick={onOpenWhatsApp}>
					<Send className="mr-1.5 size-4" />
					{pending ? "Membuka WhatsApp…" : "Buka WhatsApp"}
				</Button>
			</div>
		</Card>
	);
}
