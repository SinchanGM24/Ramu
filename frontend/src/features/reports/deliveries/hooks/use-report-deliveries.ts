import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Delivery, ManualDispatch, Recipient } from "../types";

export function useReportDeliveries(reportId: string) {
	const queryClient = useQueryClient();
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [notice, setNotice] = useState("");
	const deliveries = useQuery({
		queryKey: ["reports", reportId, "deliveries"],
		queryFn: () => api<Delivery[]>(`/reports/${reportId}/deliveries`),
	});
	const recipients = useQuery({
		queryKey: ["reports", reportId, "delivery-recipients"],
		queryFn: () => api<Recipient[]>(`/reports/${reportId}/delivery-recipients`),
	});
	useEffect(() => {
		if (!recipients.data) return;
		setSelectedIds((current) =>
			current.length
				? current.filter((id) => recipients.data?.some((recipient) => recipient.id === id))
				: recipients.data.map((recipient) => recipient.id),
		);
	}, [recipients.data]);

	const refresh = () =>
		queryClient.invalidateQueries({ queryKey: ["reports", reportId, "deliveries"] });
	const queue = useMutation({
		mutationFn: () =>
			api<Delivery[]>(`/reports/${reportId}/deliveries`, {
				method: "POST",
				body: JSON.stringify({ guardianContactIds: selectedIds }),
			}),
		onSuccess: (created) => {
			setNotice(`${created.length} kontak masuk ke antrean pengiriman.`);
			void refresh();
		},
		onError: (error) =>
			setNotice(
				error instanceof Error ? error.message : "Pengiriman belum dapat dimasukkan ke antrean.",
			),
	});
	const retry = useMutation({
		mutationFn: (deliveryId: string) => api(`/deliveries/${deliveryId}/retry`, { method: "POST" }),
		onSuccess: () => {
			setNotice("Pengiriman kembali masuk ke antrean.");
			void refresh();
		},
		onError: () => setNotice("Pengiriman belum dapat dimasukkan kembali ke antrean."),
	});
	const manualDispatch = useMutation({
		mutationFn: (deliveryId: string) =>
			api<ManualDispatch>(`/deliveries/${deliveryId}/open-whatsapp`, { method: "POST" }),
	});

	function openWhatsApp(deliveryId: string) {
		const popup = window.open("", "_blank");

		manualDispatch.mutate(deliveryId, {
			onSuccess: ({ whatsAppUrl }) => {
				if (popup) {
					popup.location.href = whatsAppUrl;
				} else {
					window.location.href = whatsAppUrl;
				}
				setNotice("Chat WhatsApp wali telah dibuka.");
				void refresh();
			},
			onError: (error) => {
				popup?.close();
				setNotice(error instanceof Error ? error.message : "Chat WhatsApp belum dapat dibuka.");
			},
		});
	}

	function toggleRecipient(id: string) {
		setSelectedIds((current) =>
			current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
		);
	}
	function toggleAllRecipients() {
		setSelectedIds((current) =>
			current.length === (recipients.data?.length ?? 0)
				? []
				: (recipients.data?.map((item) => item.id) ?? []),
		);
	}

	return {
		deliveries,
		notice,
		queue,
		recipients,
		manualDispatch,
		openWhatsApp,
		retry,
		selectedIds,
		toggleAllRecipients,
		toggleRecipient,
	};
}
