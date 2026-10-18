import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api";
import type { LifecycleClassGroup, LifecycleStudent, LifecycleStudentPage } from "../types";

const pageSize = 10;

export function useLifecycleStudents() {
	const [chosen, setChosen] = useState<string[]>([]);
	const [selectedStudents, setSelectedStudents] = useState<Record<string, LifecycleStudent>>({});
	const [classGroupId, setClassGroupId] = useState("");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const debouncedSearch = useDebouncedValue(search);
	const students = useQuery({
		queryKey: ["lifecycle-students", page, debouncedSearch, classGroupId],
		queryFn: ({ signal }) =>
			api<LifecycleStudentPage>(
				`/students?page=${page}&limit=${pageSize}&lifecycleStatus=ACTIVE&search=${encodeURIComponent(debouncedSearch)}${classGroupId ? `&classGroupId=${classGroupId}` : ""}`,
				{ signal },
			),
	});
	const classGroups = useQuery({
		queryKey: ["academic", "class-groups", "lifecycle"],
		queryFn: () => api<LifecycleClassGroup[]>("/academic/class-groups?activeOnly=true"),
	});
	const active = useMemo(() => students.data?.items ?? [], [students.data?.items]);

	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, classGroupId]);
	useEffect(() => {
		setSelectedStudents((current) => {
			const next = { ...current };
			active.forEach((student) => {
				next[student.id] = student;
			});
			return next;
		});
	}, [active]);

	const selected = useMemo(
		() => chosen.map((id) => selectedStudents[id]).filter(Boolean),
		[chosen, selectedStudents],
	);
	const allPageSelected =
		active.length > 0 && active.every((student) => chosen.includes(student.id));
	const toggle = (id: string) =>
		setChosen((current) =>
			current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
		);
	const toggleAll = () =>
		setChosen((current) => {
			if (allPageSelected)
				return current.filter((id) => !active.some((student) => student.id === id));
			return [...new Set([...current, ...active.map((student) => student.id)])];
		});
	const selectStudents = (studentsToSelect: LifecycleStudent[]) => {
		setSelectedStudents((current) => ({
			...current,
			...Object.fromEntries(studentsToSelect.map((student) => [student.id, student])),
		}));
		setChosen(studentsToSelect.map((student) => student.id));
	};

	return {
		active,
		selected,
		chosen,
		classGroupId,
		search,
		classGroups: classGroups.data ?? [],
		allPageSelected,
		page,
		total: students.data?.total ?? 0,
		loading: students.isLoading,
		setChosen,
		setClassGroupId,
		setSearch,
		setPage,
		toggle,
		toggleAll,
		selectStudents,
	};
}
