"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeliveryHistoryList } from "./components/delivery-history-list";
import { DeliveryRecipientSelector } from "./components/delivery-recipient-selector";
import { useReportDeliveries } from "./hooks/use-report-deliveries";

export function ReportDeliveriesPage({ reportId }: { reportId: string }) {
	const delivery = useReportDeliveries(reportId);

	return (
		<>
			<PageHeader
				eyebrow="Distribusi rapor"
				title="Kirim rapor kepada wali"
				description="Pilih kontak penerima, masukkan ke antrean, lalu pantau status setiap pengiriman."
				action={
					<Link href={`/app/reports/${reportId}/preview`}>
						<Button variant="secondary">Lihat rapor</Button>
					</Link>
				}
			/>
			{delivery.notice ? (
				<p
					role="status"
					className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${delivery.queue.isError || delivery.retry.isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}
				>
					{delivery.notice}
				</p>
			) : null}
			<RecipientPanel
				loading={delivery.recipients.isLoading}
				error={delivery.recipients.isError}
				recipients={delivery.recipients.data ?? []}
				selectedIds={delivery.selectedIds}
				pending={delivery.queue.isPending}
				onQueue={() => delivery.queue.mutate()}
				onReload={() => void delivery.recipients.refetch()}
				onToggleAll={delivery.toggleAllRecipients}
				onToggleRecipient={delivery.toggleRecipient}
			/>
			<DeliveryHistoryList
				loading={delivery.deliveries.isLoading}
				error={delivery.deliveries.isError}
				rows={delivery.deliveries.data ?? []}
				pendingManualDispatch={delivery.manualDispatch.isPending}
				pendingRetry={delivery.retry.isPending}
				onManualDispatch={delivery.openWhatsApp}
				onReload={() => void delivery.deliveries.refetch()}
				onRetry={(id) => delivery.retry.mutate(id)}
			/>
		</>
	);
}

function RecipientPanel({
	error,
	loading,
	pending,
	recipients,
	selectedIds,
	onQueue,
	onReload,
	onToggleAll,
	onToggleRecipient,
}: {
	error: boolean;
	loading: boolean;
	pending: boolean;
	recipients: {
		id: string;
		name: string;
		relationship: string;
		phone: string;
		is_primary: boolean;
	}[];
	selectedIds: string[];
	onQueue: () => void;
	onReload: () => void;
	onToggleAll: () => void;
	onToggleRecipient: (id: string) => void;
}) {
	if (loading) return <Card className="mb-4">Memuat kontak penerima…</Card>;
	if (error) {
		return (
			<Card className="mb-4">
				<p className="text-red-700">Kontak penerima tidak dapat dimuat.</p>
				<Button className="mt-4" variant="secondary" onClick={onReload}>
					Coba lagi
				</Button>
			</Card>
		);
	}
	return (
		<DeliveryRecipientSelector
			recipients={recipients}
			selectedIds={selectedIds}
			pending={pending}
			onQueue={onQueue}
			onToggleAll={onToggleAll}
			onToggleRecipient={onToggleRecipient}
		/>
	);
}
