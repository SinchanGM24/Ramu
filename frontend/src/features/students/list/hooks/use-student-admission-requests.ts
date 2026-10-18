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
	const resubmit = useMutation({
		mutationFn: ({
			id,
			body,
		}: {
			id: string;
			body: { classGroupId: string; gender?: string; name: string; studentNumber?: string };
		}) =>
			api<{ requestPending?: boolean }>(`/students/requests/${id}/resubmit`, {
				method: "POST",
				body: JSON.stringify(body),
			}),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["student-requests"] });
		},
	});
	return { requests, decide, resubmit };
}
