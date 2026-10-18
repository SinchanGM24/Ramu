import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DashboardSummary } from "../types";

export function useDashboardSummary() {
	return useQuery({
		queryKey: ["dashboard", "summary"],
		queryFn: () => api<DashboardSummary>("/dashboard/summary"),
	});
}
