import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { LifecycleProposal } from "../types";

export function useLifecycleProposals(enabled: boolean, onProcessed: () => void) {
	const queryClient = useQueryClient();
	const proposals = useQuery({
		queryKey: ["lifecycle", "proposals"],
		enabled,
		queryFn: () => api<LifecycleProposal[]>("/lifecycle/proposals"),
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
			api(`/lifecycle/proposals/${id}/decision`, {
				method: "POST",
				body: JSON.stringify({ decision, note }),
			}),
		onSuccess: () => {
			onProcessed();
			void queryClient.invalidateQueries({ queryKey: ["lifecycle", "proposals"] });
			void queryClient.invalidateQueries({ queryKey: ["students"] });
		},
	});
	return { proposals, decide };
}
