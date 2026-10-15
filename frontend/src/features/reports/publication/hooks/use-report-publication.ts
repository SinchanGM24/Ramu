import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api";
import { authSessionQueryOptions } from "@/features/auth/session";
import type { PublicationReport, Semester } from "../types";

const pageSize = 10;

export function useReportPublication() {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
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
		queryKey: ["reports", semesterId],
		enabled: Boolean(semesterId),
		queryFn: () =>
			api<
				Array<PublicationReport | { id: string; name: string; report_id?: string; status?: string }>
			>(`/reports/progress?semesterId=${semesterId}`),
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
		mutationFn: async (reportIds: string[]) => {
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

	const reports = useMemo<PublicationReport[]>(
		() =>
			(progress.data ?? []).filter(
				(item): item is PublicationReport =>
					Boolean(item.report_id) &&
					["SUBMITTED", "IN_REVIEW", "APPROVED", "PUBLISHED"].includes(item.status ?? ""),
			),
		[progress.data],
	);
	const counts = useMemo(
		() => ({
			waitingReview: reports.filter((item) => ["SUBMITTED", "IN_REVIEW"].includes(item.status))
				.length,
			approved: reports.filter((item) => item.status === "APPROVED").length,
			published: reports.filter((item) => item.status === "PUBLISHED").length,
		}),
		[reports],
	);
	const filteredReports = useMemo(
		() =>
			reports.filter((item) =>
				item.name.toLocaleLowerCase("id-ID").includes(debouncedSearch.toLocaleLowerCase("id-ID")),
			),
		[debouncedSearch, reports],
	);

	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, semesterId]);

	return {
		canPublish: session.data?.role === "SCHOOL_ADMIN",
		batchProgress,
		counts,
		error:
			publish.error instanceof Error
				? publish.error.message
				: publish.error
					? "Raport belum dapat diterbitkan. Coba lagi."
					: "",
		filteredReports,
		notice,
		page,
		pagedReports: filteredReports.slice((page - 1) * pageSize, page * pageSize),
		progress,
		publish,
		publishBatch,
		reports,
		search,
		semesterId,
		activeSemester,
		setPage,
		setSearch,
	};
}

export { pageSize };
