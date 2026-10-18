import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AcademicSemester } from "../types";

export function useAcademicSemesters() {
	return useQuery({
		queryKey: ["academic", "semesters"],
		queryFn: () => api<AcademicSemester[]>("/academic/semesters"),
	});
}

export function useActiveAcademicSemester() {
	return useQuery({
		queryKey: ["academic", "active-semester"],
		queryFn: () => api<AcademicSemester | null>("/academic/active-semester"),
	});
}
