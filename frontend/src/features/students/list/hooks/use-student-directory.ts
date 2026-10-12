import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api";
import type { ClassGroup, StudentList } from "../types";

const pageSize = 10;
export function useStudentDirectory() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [classGroupId, setClassGroupId] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, classGroupId]);
	const classes = useQuery({
		queryKey: ["academic", "class-groups", "active"],
		queryFn: () => api<ClassGroup[]>("/academic/class-groups?activeOnly=true"),
	});
	const students = useQuery({
		queryKey: ["students", page, debouncedSearch, classGroupId],
		queryFn: () =>
			api<StudentList>(
				`/students?page=${page}&limit=${pageSize}&search=${encodeURIComponent(debouncedSearch)}${classGroupId ? `&classGroupId=${classGroupId}` : ""}`,
			),
	});
	return {
		classes,
		students,
		page,
		setPage,
		search,
		setSearch,
		classGroupId,
		setClassGroupId,
		pageSize,
	};
}
