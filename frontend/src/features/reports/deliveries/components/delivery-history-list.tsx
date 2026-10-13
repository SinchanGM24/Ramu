import { AlertCircle, Check, Clock3, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Delivery } from "../types";

type DeliveryHistoryListProps = {
	error: boolean;
	loading: boolean;
	pendingManualDispatch: boolean;
	pendingRetry: boolean;
	rows: Delivery[];
	onManualDispatch: (id: string) => void;
	onReload: () => void;
	onRetry: (id: string) => void;
};

export function DeliveryHistoryList({
	error,
	loading,
	pendingManualDispatch,
	pendingRetry,
	rows,
	onManualDispatch,
	onReload,
	onRetry,
}: DeliveryHistoryListProps) {
	if (loading) return <Card>Memuat status pengiriman…</Card>;

	if (error) {
		return (
			<Card>
				<div className="flex gap-3 text-red-700">
					<AlertCircle className="mt-0.5 size-5 shrink-0" />
					<div>
						<h2 className="font-bold">Status pengiriman tidak dapat dimuat</h2>
						<p className="mt-1 text-sm">Periksa kembali akses Anda, lalu coba muat ulang.</p>
						<Button className="mt-4" variant="secondary" onClick={onReload}>
							Coba lagi
						</Button>
					</div>
				</div>
			</Card>
		);
	}

	if (!rows.length) {
		return (
			<Card className="py-10 text-center">
				<Clock3 className="mx-auto size-9 text-brand-600" />
				<h2 className="mt-3 font-bold text-slate-900">Belum ada pengiriman dalam antrean</h2>
				<p className="mt-1 text-sm text-slate-500">
					Pilih kontak wali di atas, lalu masukkan ke antrean pengiriman.
				</p>
			</Card>
		);
	}

	return (
		<section>
			<h2 className="mb-3 text-lg font-bold text-slate-900">Riwayat pengiriman</h2>
			<div className="space-y-4">
				{rows.map((delivery) => (
					<Card
						key={delivery.id}
						className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
					>
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<h3 className="font-bold text-slate-900">{delivery.guardian_name}</h3>
								<span className="text-sm text-slate-500">{delivery.relationship}</span>
							</div>
							<p className="mt-2 text-sm text-slate-600">
								{delivery.recipient_phone} · Versi rapor {delivery.version_number}
							</p>
							<p className="mt-1 text-xs text-slate-500">
								Masuk antrean: {formatDate(delivery.queued_at)} · Percobaan kirim:{" "}
								{delivery.attempt_count}
							</p>
							{delivery.failure_reason ? (
								<p className="mt-2 text-sm text-red-700">Alasan gagal: {delivery.failure_reason}</p>
							) : null}
						</div>
						<DeliveryAction
							delivery={delivery}
							pendingManualDispatch={pendingManualDispatch}
							pendingRetry={pendingRetry}
							onManualDispatch={onManualDispatch}
							onRetry={onRetry}
						/>
					</Card>
				))}
			</div>
		</section>
	);
}

function DeliveryAction({
	delivery,
	pendingManualDispatch,
	pendingRetry,
	onManualDispatch,
	onRetry,
}: {
	delivery: Delivery;
	pendingManualDispatch: boolean;
	pendingRetry: boolean;
	onManualDispatch: (id: string) => void;
	onRetry: (id: string) => void;
}) {
	if (delivery.status === "QUEUED") {
		return (
			<Button
				aria-label="Buka chat WhatsApp"
				className="size-10 min-h-0 rounded-full p-0 text-slate-600"
				disabled={pendingManualDispatch}
				title="Buka chat WhatsApp"
				variant="ghost"
				onClick={() => onManualDispatch(delivery.id)}
			>
				<Send size={17} />
			</Button>
		);
	}

	if (delivery.status === "FAILED") {
		return (
			<Button
				aria-label="Siapkan ulang pengiriman"
				className="size-10 min-h-0 rounded-full p-0"
				disabled={pendingRetry}
				title="Siapkan ulang pengiriman"
				onClick={() => onRetry(delivery.id)}
			>
				<RotateCcw size={16} />
			</Button>
		);
	}

	const completedTitle =
		delivery.status === "DELIVERED"
			? "Diterima di WhatsApp"
			: delivery.status === "READ"
				? "Dibaca di WhatsApp"
				: "Dibuka di WhatsApp";

	return (
		<span
			aria-label={completedTitle}
			className="grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-700"
			role="img"
			title={completedTitle}
		>
			<Check size={18} strokeWidth={2.5} />
		</span>
	);
}

function formatDate(value: string) {
	return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
		new Date(value),
	);
}
