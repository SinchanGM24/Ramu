"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FilePenLine } from "lucide-react";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { authSessionQueryOptions } from "@/features/auth/session";
import { api } from "@/lib/api";

export function StartReportCorrectionAction({ reportId }: { reportId: string }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const session = useQuery(authSessionQueryOptions);
	const [open, setOpen] = useState(false);
	const correction = useMutation({
		mutationFn: () => api(`/reports/${reportId}/correction`, { method: "POST" }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["reports"] });
			await queryClient.invalidateQueries({ queryKey: ["published-report", reportId] });
			setOpen(false);
			router.push("/app/reports/publication");
		},
	});
	const canStartCorrection =
		session.data?.role === "SCHOOL_ADMIN" || session.data?.role === "PRINCIPAL";

	if (!canStartCorrection) return null;

	return (
		<>
			<Button type="button" variant="secondary" onClick={() => setOpen(true)}>
				<FilePenLine className="size-4" aria-hidden="true" />
				Buat koreksi
			</Button>
			{correction.error ? (
				<p role="alert" className="text-sm font-medium text-red-700">
					{correction.error instanceof Error
						? correction.error.message
						: "Koreksi raport belum dapat dibuat. Coba lagi."}
				</p>
			) : null}
			<ConfirmationDialog
				open={open}
				title="Buat draf koreksi raport?"
				description="Versi raport yang sudah diterbitkan, PDF, tautan wali, dan riwayat pengiriman tetap tersimpan. Perubahan berikutnya dikerjakan sebagai draf lalu melalui tinjauan dan penerbitan baru."
				confirmLabel="Buat draf koreksi"
				onCancel={() => setOpen(false)}
				onConfirm={() => correction.mutate()}
			/>
		</>
	);
}
