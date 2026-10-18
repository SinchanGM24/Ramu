import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api";
import { authSessionQueryOptions } from "@/features/auth/session";
import type { DeliveryFilter, PublicationPage, Semester } from "../types";

const pageSize = 10;
const emptyCounts = { waitingReview: 0, approved: 0, published: 0, correction: 0 };
type PublicationJob = {
	id: string;
	status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
	total_count: number;
	completed_count: number;
	failed_count: number;
};

export function useReportPublication() {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>("ALL");
	const [notice, setNotice] = useState("");
	const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number } | null>(
		null,
	);
	const [publicationJobId, setPublicationJobId] = useState<string | null>(null);
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
	const publicationJob = useQuery({
		queryKey: ["reports", "publication-job", publicationJobId],
		enabled: Boolean(publicationJobId),
		queryFn: ({ signal }) =>
			api<PublicationJob>(`/reports/publication-jobs/${publicationJobId}`, { signal }),
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			return status === "QUEUED" || status === "PROCESSING" ? 1_000 : false;
		},
	});
	const publishBatch = useMutation({
		mutationFn: async () => {
			const reportIds = await api<string[]>(`/reports/publishable-ids?semesterId=${semesterId}`);
			return api<PublicationJob>("/reports/publication-jobs", {
				method: "POST",
				body: JSON.stringify({ reportIds, semesterId }),
			});
		},
		onSuccess: (job) => {
			setPublicationJobId(job.id);
			setBatchProgress({ completed: 0, total: job.total_count });
			setNotice("Publikasi batch sedang diproses di latar belakang.");
		},
	});

	useEffect(() => {
		if (!publicationJob.data) return;
		setBatchProgress({
			completed: publicationJob.data.completed_count + publicationJob.data.failed_count,
			total: publicationJob.data.total_count,
		});
		if (!["COMPLETED", "FAILED"].includes(publicationJob.data.status)) return;
		setNotice(
			publicationJob.data.failed_count
				? `${publicationJob.data.completed_count} raport berhasil diterbitkan. ${publicationJob.data.failed_count} raport belum dapat diterbitkan.`
				: "Seluruh raport batch berhasil diterbitkan dan siap dikirim kepada wali.",
		);
		void queryClient.invalidateQueries({ queryKey: ["reports", semesterId] });
		void queryClient.invalidateQueries({ queryKey: ["reports"] });
		setPublicationJobId(null);
	}, [publicationJob.data, queryClient, semesterId]);

	const reports = progress.data?.items ?? [];
	const counts = progress.data?.summary ?? emptyCounts;
	const batchPending =
		publishBatch.isPending ||
		publicationJob.data?.status === "QUEUED" ||
		publicationJob.data?.status === "PROCESSING";

	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, deliveryFilter, semesterId]);

	return {
		canPublish: session.data?.role === "SCHOOL_ADMIN",
		batchProgress,
		batchPending,
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
