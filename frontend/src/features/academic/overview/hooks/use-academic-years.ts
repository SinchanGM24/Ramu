import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AcademicYear } from "../types";

export function useAcademicYears() {
	const years = useQuery({
		queryKey: ["academic", "years"],
		queryFn: () => api<AcademicYear[]>("/academic/years"),
	});
	return { ...years, activeYear: years.data?.find((year) => year.is_active) };
}
