import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLifecycleProposals } from "./use-lifecycle-proposals";
import { useLifecycleStudents } from "./use-lifecycle-students";
import type { LifecycleMode } from "../types";

export function useLifecyclePage() {
	const queryClient = useQueryClient();
	const [mode, setMode] = useState<LifecycleMode>("transfer");
	const [isActionOpen, setActionOpen] = useState(false);
	const [notice, setNotice] = useState("");
	const [error, setError] = useState("");
	const session = useQuery({
		queryKey: ["session"],
		queryFn: () => api<{ role: "SCHOOL_ADMIN" | "TEACHER" | "PRINCIPAL" }>("/auth/session"),
	});
	const isTeacher = session.data?.role === "TEACHER";
	const isPrincipal = session.data?.role === "PRINCIPAL";
	const directory = useLifecycleStudents();
	const { proposals, decide } = useLifecycleProposals(isPrincipal, () =>
		setNotice("Pengajuan telah diproses."),
	);
	function switchMode(next: LifecycleMode) {
		setMode(next);
		directory.setChosen([]);
		setActionOpen(false);
		setError("");
	}
	async function completeAction(message: string) {
		setActionOpen(false);
		directory.setChosen([]);
		setNotice(message);
		await queryClient.invalidateQueries({ queryKey: ["students"] });
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
		setActionOpen,
		setError,
		switchMode,
		completeAction,
	};
}
