"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeliveryHistoryList } from "./components/delivery-history-list";
import { DeliveryRecipientSelector } from "./components/delivery-recipient-selector";
import { useReportDeliveries } from "./hooks/use-report-deliveries";
import type { Recipient } from "./types";
import { reportPreviewHref } from "../utils/report-navigation";

export function ReportDeliveriesPage({ reportId }: { reportId: string }) {
	const delivery = useReportDeliveries(reportId);
	const searchParams = useSearchParams();
	const openedFromPublication = searchParams.get("from") === "publication";

	return (
		<>
			<PageHeader
				eyebrow="Distribusi raport"
				title="Kirim raport kepada wali"
				description="Pilih kontak penerima, lalu buka WhatsApp untuk mengirimkan tautan raport secara personal."
				action={
					<div className="flex flex-wrap gap-2">
						{openedFromPublication ? (
							<Link href="/app/reports/publication">
								<Button variant="secondary">Kembali ke publikasi</Button>
							</Link>
						) : null}
						<Link
							href={reportPreviewHref(reportId, "deliveries", {
								returnTo: openedFromPublication ? "publication" : undefined,
							})}
						>
							<Button variant="secondary">Lihat raport</Button>
						</Link>
					</div>
				}
			/>
			{delivery.notice ? (
				<p
					role={delivery.noticeIsError ? "alert" : "status"}
					className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ${delivery.noticeIsError ? "border-red-100 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-800"}`}
				>
					{delivery.notice}
				</p>
			) : null}
			<RecipientPanel
				loading={delivery.recipients.isLoading}
				error={delivery.recipients.isError}
				recipients={delivery.recipients.data ?? []}
				selectedIds={delivery.selectedIds}
				pending={delivery.sendToWhatsApp.isPending}
				onOpenWhatsApp={delivery.sendSelectedToWhatsApp}
				onReload={() => void delivery.recipients.refetch()}
				reportId={reportId}
				studentId={delivery.context.data?.studentId}
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
	onOpenWhatsApp,
	onReload,
	reportId,
	studentId,
	onToggleAll,
	onToggleRecipient,
}: {
	error: boolean;
	loading: boolean;
	pending: boolean;
	recipients: Recipient[];
	selectedIds: string[];
	onOpenWhatsApp: () => void;
	onReload: () => void;
	reportId: string;
	studentId?: string;
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
			onOpenWhatsApp={onOpenWhatsApp}
			reportId={reportId}
			studentId={studentId}
			onToggleAll={onToggleAll}
			onToggleRecipient={onToggleRecipient}
		/>
	);
}
