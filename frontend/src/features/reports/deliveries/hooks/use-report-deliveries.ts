import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { authSessionQueryOptions } from "@/features/auth/session";
import type { Delivery, DeliveryContext, ManualDispatch, Recipient } from "../types";

export function useReportDeliveries(reportId: string) {
	const queryClient = useQueryClient();
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [notice, setNotice] = useState("");
	const [noticeIsError, setNoticeIsError] = useState(false);
	const session = useQuery(authSessionQueryOptions);
	const deliveries = useQuery({
		queryKey: ["reports", reportId, "deliveries"],
		queryFn: () => api<Delivery[]>(`/reports/${reportId}/deliveries`),
	});
	const recipients = useQuery({
		queryKey: ["reports", reportId, "delivery-recipients"],
		queryFn: () => api<Recipient[]>(`/reports/${reportId}/delivery-recipients`),
	});
	const context = useQuery({
		queryKey: ["reports", reportId, "delivery-context"],
		queryFn: () => api<DeliveryContext>(`/reports/${reportId}/delivery-context`),
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
	const sendToWhatsApp = useMutation({
		mutationFn: async () => {
			const deliveries = await api<Delivery[]>(`/reports/${reportId}/deliveries`, {
				method: "POST",
				body: JSON.stringify({ guardianContactIds: selectedIds }),
			});
			const delivery = deliveries[0];
			if (!delivery) throw new Error("Kontak wali penerima tidak ditemukan");

			return api<ManualDispatch>(`/deliveries/${delivery.id}/open-whatsapp`, {
				method: "POST",
			});
		},
	});
	const retry = useMutation({
		mutationFn: (deliveryId: string) => api(`/deliveries/${deliveryId}/retry`, { method: "POST" }),
		onSuccess: () => {
			setNoticeIsError(false);
			setNotice("Pengiriman kembali masuk ke antrean.");
			void refresh();
		},
		onError: () => {
			setNoticeIsError(true);
			setNotice("Pengiriman belum dapat dimasukkan kembali ke antrean.");
		},
	});
	const manualDispatch = useMutation({
		mutationFn: (deliveryId: string) =>
			api<ManualDispatch>(`/deliveries/${deliveryId}/open-whatsapp`, { method: "POST" }),
	});
	const regenerateAccess = useMutation({
		mutationFn: (deliveryId: string) =>
			api<ManualDispatch>(`/deliveries/${deliveryId}/regenerate-access`, {
				method: "POST",
			}),
	});

	function openWhatsApp(deliveryId: string) {
		const popup = window.open("", "_blank");
		if (!popup) {
			setNoticeIsError(true);
			setNotice(
				"Browser memblokir jendela WhatsApp. Izinkan pop-up untuk situs ini, lalu coba lagi.",
			);
			return;
		}

		manualDispatch.mutate(deliveryId, {
			onSuccess: ({ whatsAppUrl }) => {
				popup.location.href = whatsAppUrl;
				setNoticeIsError(false);
				setNotice("Chat WhatsApp wali telah dibuka.");
				void refresh();
			},
			onError: (error) => {
				popup.close();
				setNoticeIsError(true);
				setNotice(error instanceof Error ? error.message : "Chat WhatsApp belum dapat dibuka.");
			},
		});
	}

	function sendSelectedToWhatsApp() {
		const popup = window.open("", "_blank");
		if (!popup) {
			setNoticeIsError(true);
			setNotice(
				"Browser memblokir jendela WhatsApp. Izinkan pop-up untuk situs ini, lalu coba lagi.",
			);
			return;
		}

		sendToWhatsApp.mutate(undefined, {
			onSuccess: ({ whatsAppUrl }) => {
				popup.location.href = whatsAppUrl;
				setNoticeIsError(false);
				setNotice("Chat WhatsApp wali telah dibuka.");
				void refresh();
			},
			onError: (error) => {
				popup.close();
				setNoticeIsError(true);
				setNotice(error instanceof Error ? error.message : "Chat WhatsApp belum dapat dibuka.");
			},
		});
	}

	function regenerateParentAccess(deliveryId: string) {
		const popup = window.open("", "_blank");
		if (!popup) {
			setNoticeIsError(true);
			setNotice(
				"Browser memblokir jendela WhatsApp. Izinkan pop-up untuk situs ini, lalu coba lagi.",
			);
			return;
		}

		regenerateAccess.mutate(deliveryId, {
			onSuccess: ({ whatsAppUrl }) => {
				popup.location.href = whatsAppUrl;
				setNoticeIsError(false);
				setNotice("Tautan dan PIN baru telah dibuat. Chat WhatsApp wali dibuka.");
				void refresh();
			},
			onError: (error) => {
				popup.close();
				setNoticeIsError(true);
				setNotice(
					error instanceof Error ? error.message : "Tautan dan PIN baru belum dapat dibuat.",
				);
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
		context,
		canRegenerateAccess: session.data?.role === "SCHOOL_ADMIN",
		deliveries,
		notice,
		noticeIsError,
		sendSelectedToWhatsApp,
		sendToWhatsApp,
		recipients,
		manualDispatch,
		regenerateAccess,
		regenerateParentAccess,
		openWhatsApp,
		retry,
		selectedIds,
		toggleAllRecipients,
		toggleRecipient,
	};
}
