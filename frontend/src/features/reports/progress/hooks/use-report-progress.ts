import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api";
import type { ProgressFilter, ProgressItem, Semester } from "../types";
import { getProgressCounts, matchesProgressFilter, pageSize } from "../utils";

export function useReportProgress() {
	const queryClient = useQueryClient();
	const [semesterId, setSemesterId] = useState("");
	const [filter, setFilter] = useState<ProgressFilter>("ALL");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [error, setError] = useState("");
	const debouncedSearch = useDebouncedValue(search);
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
		queryFn: () => api<ProgressItem[]>(`/reports/progress?semesterId=${semesterId}`),
	});
	const items = useMemo(() => progress.data ?? [], [progress.data]);
	const counts = useMemo(() => getProgressCounts(items), [items]);
	useEffect(() => {
		setPage(1);
	}, [semesterId, filter, debouncedSearch]);
	const filteredItems = items.filter(
		(item) =>
			matchesProgressFilter(item, filter) &&
			item.name.toLocaleLowerCase("id-ID").includes(debouncedSearch.toLocaleLowerCase("id-ID")),
	);
	const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);
	async function createDraft(studentId: string) {
		if (!semesterId) return;
		setError("");
		try {
			await api(`/reports/students/${studentId}/draft`, {
				method: "POST",
				body: JSON.stringify({ semesterId }),
			});
			await queryClient.invalidateQueries({ queryKey: ["reports", semesterId] });
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Draf rapor tidak dapat dibuat.");
		}
	}
	return {
		counts,
		createDraft,
		error,
		filter,
		filteredItems,
		items,
		page,
		pagedItems,
		progress,
		search,
		semesterId,
		semesters,
		setFilter,
		setPage,
		setSearch,
		setSemesterId,
	};
}
