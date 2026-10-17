import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api";
import type { ProgressPage, Semester } from "../types";
import { pageSize } from "../utils";

export function useReportProgress() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [error, setError] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const activeSemester = useQuery({
		queryKey: ["academic", "active-semester"],
		queryFn: () => api<Semester | null>("/academic/active-semester"),
	});
	const semesterId = activeSemester.data?.id || "";
	const progress = useQuery({
		queryKey: ["reports", "progress", semesterId, page, debouncedSearch],
		enabled: Boolean(semesterId),
		queryFn: ({ signal }) =>
			api<ProgressPage>(
				`/reports/progress?semesterId=${semesterId}&view=EDITOR&page=${page}&limit=${pageSize}&search=${encodeURIComponent(debouncedSearch)}`,
				{ signal },
			),
	});
	const items = progress.data?.items ?? [];
	const counts = progress.data?.summary ?? {
		total: 0,
		notCreated: 0,
		draft: 0,
		review: 0,
		publish: 0,
		published: 0,
	};

	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, semesterId]);

	async function createDraft(studentId: string) {
		if (!semesterId) return;
		setError("");
		try {
			const report = await api<{ id: string }>(`/reports/students/${studentId}/draft`, {
				method: "POST",
				body: JSON.stringify({ semesterId }),
			});
			await queryClient.invalidateQueries({ queryKey: ["reports"] });
			router.push(`/app/reports/${report.id}`);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Draf raport tidak dapat dibuat.");
		}
	}

	return {
		activeSemester,
		counts,
		createDraft,
		error,
		items,
		page,
		progress,
		search,
		semesterId,
		setPage,
		setSearch,
	};
}
