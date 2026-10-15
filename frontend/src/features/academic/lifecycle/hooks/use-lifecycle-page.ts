import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { authSessionQueryOptions } from "@/features/auth/session";
import { useLifecycleProposals } from "./use-lifecycle-proposals";
import { useLifecycleStudents } from "./use-lifecycle-students";
import type { LifecycleMode, LifecycleProposal } from "../types";

export function useLifecyclePage() {
	const queryClient = useQueryClient();
	const [mode, setMode] = useState<LifecycleMode>("transfer");
	const [isActionOpen, setActionOpen] = useState(false);
	const [notice, setNotice] = useState("");
	const [error, setError] = useState("");
	const [resubmission, setResubmission] = useState<LifecycleProposal | null>(null);
	const session = useQuery(authSessionQueryOptions);
	const isTeacher = session.data?.role === "TEACHER";
	const isPrincipal = session.data?.role === "PRINCIPAL";
	const directory = useLifecycleStudents();
	const { proposals, decide } = useLifecycleProposals(Boolean(isPrincipal || isTeacher), () =>
		setNotice("Pengajuan telah diproses."),
	);
	function switchMode(next: LifecycleMode) {
		setMode(next);
		directory.setChosen([]);
		setActionOpen(false);
		setResubmission(null);
		setError("");
	}
	function startResubmission(proposal: LifecycleProposal) {
		const requestedIds = proposal.students.map((student) => student.studentId);
		const availableIds = new Set(directory.active.map((student) => student.id));
		if (!requestedIds.length || requestedIds.some((studentId) => !availableIds.has(studentId))) {
			setError(
				"Pengajuan ini tidak dapat diajukan ulang karena ada murid yang tidak lagi berada pada kelas penugasan Anda.",
			);
			return;
		}
		directory.setChosen(requestedIds);
		setMode(proposal.operation_type === "TRANSFER" ? "transfer" : "graduation");
		setResubmission(proposal);
		setError("");
		setActionOpen(true);
	}
	async function completeAction(message: string) {
		setActionOpen(false);
		directory.setChosen([]);
		setResubmission(null);
		setNotice(message);
		await queryClient.invalidateQueries({ queryKey: ["students"] });
		await queryClient.invalidateQueries({ queryKey: ["lifecycle", "proposals"] });
	}
	return {
		mode,
		directory,
		isActionOpen,
		notice,
		error,
		isTeacher,
		isPrincipal,
		proposals,
		decide,
		resubmission,
		setActionOpen,
		setResubmission,
		setError,
		switchMode,
		startResubmission,
		completeAction,
	};
}
