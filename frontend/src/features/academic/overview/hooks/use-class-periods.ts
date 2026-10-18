import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ClassPeriod } from "../types";

export function useClassPeriods(academicYearId?: string) {
	return useQuery({
		queryKey: ["academic", "class-periods", academicYearId],
		enabled: Boolean(academicYearId),
		queryFn: () => api<ClassPeriod[]>(`/academic/class-periods?academicYearId=${academicYearId}`),
	});
}
