import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api";
import { authSessionQueryOptions } from "@/features/auth/session";
import type { DeliveryFilter, PublicationPage, Semester } from "../types";

const pageSize = 10;
const emptyCounts = { waitingReview: 0, approved: 0, published: 0, correction: 0 };

export function useReportPublication() {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>("ALL");
	const [notice, setNotice] = useState("");
	const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number } | null>(
		null,
	);
	const debouncedSearch = useDebouncedValue(search);
	const session = useQuery(authSessionQueryOptions);
	const activeSemester = useQuery({
		queryKey: ["academic", "active-semester"],
		queryFn: () => api<Semester | null>("/academic/active-semester"),
	});
	const semesterId = activeSemester.data?.id || "";

	const progress = useQuery({
		queryKey: ["reports", "publication", semesterId, page, debouncedSearch, deliveryFilter],
		enabled: Boolean(semesterId),
		queryFn: ({ signal }) =>
			api<PublicationPage>(
				`/reports/progress?semesterId=${semesterId}&view=PUBLICATION&page=${page}&limit=${pageSize}&search=${encodeURIComponent(debouncedSearch)}&deliveryFilter=${deliveryFilter}`,
				{ signal },
			),
	});
	const publish = useMutation({
		mutationFn: (reportId: string) => api(`/reports/${reportId}/publish`, { method: "POST" }),
		onSuccess: async () => {
			setNotice("Raport berhasil diterbitkan dan siap dikirim kepada wali.");
			await queryClient.invalidateQueries({ queryKey: ["reports", semesterId] });
			await queryClient.invalidateQueries({ queryKey: ["reports"] });
		},
	});
	const publishBatch = useMutation({
		mutationFn: async () => {
			const reportIds = await api<string[]>(`/reports/publishable-ids?semesterId=${semesterId}`);
			const failures: string[] = [];
			setBatchProgress({ completed: 0, total: reportIds.length });
			for (const [index, reportId] of reportIds.entries()) {
				try {
					await api(`/reports/${reportId}/publish`, { method: "POST" });
				} catch {
					failures.push(reportId);
				}
				setBatchProgress({ completed: index + 1, total: reportIds.length });
			}
			return { failures, published: reportIds.length - failures.length };
		},
		onSuccess: async ({ failures, published }) => {
			setNotice(
				failures.length
					? `${published} raport berhasil diterbitkan. ${failures.length} raport belum dapat diterbitkan.`
					: `${published} raport berhasil diterbitkan dan siap dikirim kepada wali.`,
			);
			await queryClient.invalidateQueries({ queryKey: ["reports", semesterId] });
			await queryClient.invalidateQueries({ queryKey: ["reports"] });
		},
		onSettled: () => setBatchProgress(null),
	});

	const reports = progress.data?.items ?? [];
	const counts = progress.data?.summary ?? emptyCounts;

	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, deliveryFilter, semesterId]);

	return {
		canPublish: session.data?.role === "SCHOOL_ADMIN",
		batchProgress,
		counts,
		deliveryFilter,
		error:
			publish.error instanceof Error
				? publish.error.message
				: publish.error
					? "Raport belum dapat diterbitkan. Coba lagi."
					: "",
		notice,
		page,
		progress,
		publish,
		publishBatch,
		reports,
		search,
		semesterId,
		activeSemester,
		setPage,
		setDeliveryFilter,
		setSearch,
	};
}

export { pageSize };
