import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { LifecycleStudent } from "../types";

export function useLifecycleStudents() {
	const [chosen, setChosen] = useState<string[]>([]);
	const [classFilter, setClassFilter] = useState("");
	const [search, setSearch] = useState("");
	const students = useQuery({
		queryKey: ["students"],
		queryFn: () => api<{ items: LifecycleStudent[] }>("/students?limit=100"),
	});
	const active = useMemo(
		() =>
			students.data?.items.filter(
				(student) =>
					student.lifecycle_status === "ACTIVE" &&
					(!classFilter || student.class_name === classFilter) &&
					student.name.toLowerCase().includes(search.toLowerCase()),
			) ?? [],
		[students.data, classFilter, search],
	);
	const selected = active.filter((student) => chosen.includes(student.id));
	const allFiltered = active.length > 0 && active.every((student) => chosen.includes(student.id));
	const classes = [
		...new Set((students.data?.items ?? []).map((student) => student.class_name).filter(Boolean)),
	] as string[];
	const toggle = (id: string) =>
		setChosen((current) =>
			current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
		);
	const toggleAll = () => setChosen(allFiltered ? [] : active.map((student) => student.id));
	return {
		active,
		selected,
		chosen,
		classFilter,
		search,
		classes,
		allFiltered,
		setChosen,
		setClassFilter,
		setSearch,
		toggle,
		toggleAll,
	};
}
