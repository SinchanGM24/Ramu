import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api";
import type { ProgressItem, Semester } from "../types";
import { getProgressCounts, pageSize } from "../utils";

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
		queryKey: ["reports", semesterId],
		enabled: Boolean(semesterId),
		queryFn: () => api<ProgressItem[]>(`/reports/progress?semesterId=${semesterId}`),
	});
	const items = useMemo(() => progress.data ?? [], [progress.data]);
	const counts = useMemo(() => getProgressCounts(items), [items]);

	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, semesterId]);

	const editableItems = items.filter(
		(item) => !item.status || ["DRAFT", "REVISION_REQUIRED"].includes(item.status),
	);
	const filteredItems = editableItems.filter((item) =>
		item.name.toLocaleLowerCase("id-ID").includes(debouncedSearch.toLocaleLowerCase("id-ID")),
	);
	const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

	async function createDraft(studentId: string) {
		if (!semesterId) return;
		setError("");
		try {
			const report = await api<{ id: string }>(`/reports/students/${studentId}/draft`, {
				method: "POST",
				body: JSON.stringify({ semesterId }),
			});
			await queryClient.invalidateQueries({ queryKey: ["reports", semesterId] });
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
		filteredItems,
		items,
		page,
		pagedItems,
		progress,
		search,
		semesterId,
		setPage,
		setSearch,
	};
}
