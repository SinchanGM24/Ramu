import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api";
import { authSessionQueryOptions } from "@/features/auth/session";
import type { DeliveryFilter, PublicationReport, Semester } from "../types";

const pageSize = 10;

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
			(progress.data ?? [])
				.filter(
					(item): item is PublicationReport =>
						Boolean(item.report_id) &&
						["SUBMITTED", "IN_REVIEW", "APPROVED", "PUBLISHED"].includes(item.status ?? ""),
				)
				.sort((left, right) => {
					const priorityDifference = deliveryPriority(left) - deliveryPriority(right);
					if (priorityDifference) return priorityDifference;

					const activityDifference = latestActivity(right) - latestActivity(left);
					if (activityDifference) return activityDifference;

					// Pertahankan urutan respons API saat prioritas dan waktu sama.
					// Jangan gunakan abjad sebagai fallback agar filter "Semua"
					// tetap mengikuti urutan kerja dan waktu.
					return 0;
				}),
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
			reports
				.filter((item) =>
					item.name.toLocaleLowerCase("id-ID").includes(debouncedSearch.toLocaleLowerCase("id-ID")),
				)
				.filter((item) => matchesDeliveryFilter(item, deliveryFilter)),
		[debouncedSearch, deliveryFilter, reports],
	);

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
		setDeliveryFilter,
		setSearch,
	};
}

export { pageSize };

function deliveryPriority(report: PublicationReport) {
	const needsDelivery =
		report.status === "PUBLISHED" &&
		!report.delivery_whatsapp_opened_at &&
		(!report.delivery_status || ["QUEUED", "FAILED"].includes(report.delivery_status));

	return needsDelivery ? 0 : 1;
}

function latestActivity(report: PublicationReport) {
	const timestamp = report.report_updated_at || report.submitted_at;
	const parsed = timestamp ? Date.parse(timestamp) : Number.NaN;
	return Number.isNaN(parsed) ? 0 : parsed;
}

function matchesDeliveryFilter(report: PublicationReport, filter: DeliveryFilter) {
	if (filter === "ALL") return true;
	if (filter === "FAILED") return report.delivery_status === "FAILED";
	if (filter === "OPENED") {
		return (
			Boolean(report.delivery_whatsapp_opened_at) ||
			["SENT", "DELIVERED", "READ"].includes(report.delivery_status ?? "")
		);
	}

	return (
		report.status === "PUBLISHED" &&
		!report.delivery_whatsapp_opened_at &&
		(!report.delivery_status || report.delivery_status === "QUEUED")
	);
}
