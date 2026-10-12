import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AdmissionRequest } from "../types";

export function useStudentAdmissionRequests(enabled: boolean) {
	const queryClient = useQueryClient();
	const requests = useQuery({
		queryKey: ["student-requests"],
		queryFn: () => api<AdmissionRequest[]>("/students/requests"),
		enabled,
	});
	const decide = useMutation({
		mutationFn: ({
			id,
			decision,
			note,
		}: {
			id: string;
			decision: "APPROVED" | "REJECTED";
			note?: string;
		}) =>
			api(`/students/requests/${id}/decision`, {
				method: "POST",
				body: JSON.stringify({ decision, note }),
			}),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["student-requests"] });
			void queryClient.invalidateQueries({ queryKey: ["students"] });
		},
	});
	return { requests, decide };
}
