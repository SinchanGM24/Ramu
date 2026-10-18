import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { ReportWorkspace } from "../types";

export function useReportWorkspace(reportId: string) {
	const queryClient = useQueryClient();
	const [pendingScaleOptionIds, setPendingScaleOptionIds] = useState<Record<string, string>>({});
	const workspace = useQuery({
		queryKey: ["report-workspace", reportId],
		queryFn: () => api<ReportWorkspace | null>(`/reports/${reportId}/workspace`),
	});
	const refresh = () => {
		void queryClient.invalidateQueries({ queryKey: ["report-workspace", reportId] });
		void queryClient.invalidateQueries({ queryKey: ["report-completeness", reportId] });
	};
	const assessment = useMutation({
		scope: { id: `report-assessments:${reportId}` },
		mutationFn: ({ indicatorId, scaleOptionId }: { indicatorId: string; scaleOptionId: string }) =>
			api(`/reports/${reportId}/assessments/${indicatorId}`, {
				method: "PUT",
				body: JSON.stringify({ scaleOptionId }),
			}),
		onMutate: ({ indicatorId, scaleOptionId }) =>
			setPendingScaleOptionIds((current) => ({ ...current, [indicatorId]: scaleOptionId })),
		onSuccess: refresh,
		onSettled: (_result, _error, variables) =>
			setPendingScaleOptionIds((current) => {
				const next = { ...current };
				delete next[variables.indicatorId];
				return next;
			}),
	});
	return { assessment, pendingScaleOptionIds, refresh, workspace };
}
