import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api";
import { authSessionQueryOptions } from "@/features/auth/session";
import type { PublicationReport, PublicationStatus, Semester } from "../types";

const pageSize = 10;

export function useReportPublication() {
	const queryClient = useQueryClient();
	const [semesterId, setSemesterId] = useState("");
	const [status, setStatus] = useState<PublicationStatus>("APPROVED");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [notice, setNotice] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const session = useQuery(authSessionQueryOptions);
	const semesters = useQuery({
		queryKey: ["academic", "semesters"],
		queryFn: () => api<Semester[]>("/academic/semesters"),
	});

	useEffect(() => {
		if (!semesterId && semesters.data?.[0]) setSemesterId(semesters.data[0].id);
	}, [semesterId, semesters.data]);

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
			setNotice("Rapor berhasil diterbitkan dan siap dikirim kepada wali.");
			setStatus("PUBLISHED");
			await queryClient.invalidateQueries({ queryKey: ["reports", semesterId] });
			await queryClient.invalidateQueries({ queryKey: ["reports"] });
		},
	});

	const reports = useMemo<PublicationReport[]>(
		() =>
			(progress.data ?? []).filter(
				(item): item is PublicationReport =>
					Boolean(item.report_id) && (item.status === "APPROVED" || item.status === "PUBLISHED"),
			),
		[progress.data],
	);
	const counts = useMemo(
		() => ({
			approved: reports.filter((item) => item.status === "APPROVED").length,
			published: reports.filter((item) => item.status === "PUBLISHED").length,
		}),
		[reports],
	);
	const filteredReports = useMemo(
		() =>
			reports.filter(
				(item) =>
					item.status === status &&
					item.name.toLocaleLowerCase("id-ID").includes(debouncedSearch.toLocaleLowerCase("id-ID")),
			),
		[debouncedSearch, reports, status],
	);

	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, semesterId, status]);

	return {
		canPublish: session.data?.role === "SCHOOL_ADMIN",
		counts,
		error:
			publish.error instanceof Error
				? publish.error.message
				: publish.error
					? "Rapor belum dapat diterbitkan. Coba lagi."
					: "",
		filteredReports,
		notice,
		page,
		pagedReports: filteredReports.slice((page - 1) * pageSize, page * pageSize),
		progress,
		publish,
		search,
		semesterId,
		semesters,
		setPage,
		setSearch,
		setSemesterId,
		setStatus,
		status,
	};
}

export { pageSize };
