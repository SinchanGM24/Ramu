"use client";

import { type ReactNode, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { StudentAdmissionRequests } from "./components/student-admission-requests";
import { StudentCreateDialog } from "./components/student-create-dialog";
import { StudentDirectoryTable } from "./components/student-directory-table";
import { useStudentAdmissionRequests } from "./hooks/use-student-admission-requests";
import { useStudentDirectory } from "./hooks/use-student-directory";
import type { StudentTab } from "./types";

export function StudentsPage() {
	const queryClient = useQueryClient();
	const [tab, setTab] = useState<StudentTab>("students");
	const [modalOpen, setModalOpen] = useState(false);
	const [formError, setFormError] = useState("");
	const session = useQuery({
		queryKey: ["session"],
		queryFn: () => api<{ role: string }>("/auth/session"),
	});
	const isTeacher = session.data?.role === "TEACHER";
	const directory = useStudentDirectory();
	const { requests, decide } = useStudentAdmissionRequests(tab === "requests");

	async function createStudent(body: {
		classGroupId: string;
		gender?: string;
		name: string;
		studentNumber?: string;
	}) {
		setFormError("");
		try {
			const result = await api<{ requestPending?: boolean }>("/students", {
				method: "POST",
				body: JSON.stringify(body),
			});
			setModalOpen(false);
			if (result.requestPending) setTab("requests");
			await queryClient.invalidateQueries({ queryKey: ["students"] });
			await queryClient.invalidateQueries({ queryKey: ["student-requests"] });
		} catch (error) {
			setFormError(error instanceof Error ? error.message : "Data murid belum dapat disimpan.");
		}
	}

	return (
		<>
			<PageHeader
				eyebrow="Data murid"
				title="Murid"
				description={
					isTeacher
						? "Lihat dan lengkapi data murid pada kelas penugasan Anda. Murid baru menunggu persetujuan Admin Sekolah."
						: "Kelola data murid, penempatan kelas, dan tinjau pengajuan murid dari guru."
				}
				action={
					<Button
						onClick={() => {
							setFormError("");
							setModalOpen(true);
						}}
					>
						<Plus className="mr-1.5 size-4" />
						Tambah murid
					</Button>
				}
			/>
			<StudentTabs tab={tab} isTeacher={isTeacher} onChange={setTab} />
			{tab === "students" ? (
				<StudentDirectoryTable
					classGroupId={directory.classGroupId}
					classes={directory.classes.data ?? []}
					error={directory.students.isError}
					loading={directory.students.isLoading}
					page={directory.page}
					pageSize={directory.pageSize}
					search={directory.search}
					students={directory.students.data}
					onClassGroupIdChange={directory.setClassGroupId}
					onPageChange={directory.setPage}
					onRetry={() => void directory.students.refetch()}
					onSearchChange={directory.setSearch}
				/>
			) : (
				<StudentAdmissionRequests
					rows={requests.data ?? []}
					loading={requests.isLoading}
					isTeacher={isTeacher}
					pending={decide.isPending}
					onDecide={(id, decision, note) => decide.mutate({ id, decision, note })}
				/>
			)}
			{modalOpen ? (
				<StudentCreateDialog
					classes={directory.classes.data ?? []}
					error={formError}
					isTeacher={isTeacher}
					onClose={() => setModalOpen(false)}
					onSubmit={createStudent}
				/>
			) : null}
		</>
	);
}

function StudentTabs({
	isTeacher,
	onChange,
	tab,
}: {
	isTeacher: boolean;
	onChange: (tab: StudentTab) => void;
	tab: StudentTab;
}) {
	return (
		<div
			className="mb-5 flex gap-5 border-b border-slate-200"
			role="tablist"
			aria-label="Data murid"
		>
			<TabButton active={tab === "students"} onClick={() => onChange("students")}>
				Daftar murid
			</TabButton>
			<TabButton active={tab === "requests"} onClick={() => onChange("requests")}>
				{isTeacher ? "Pengajuan saya" : "Pengajuan guru"}
			</TabButton>
		</div>
	);
}

function TabButton({
	active,
	children,
	onClick,
}: {
	active: boolean;
	children: ReactNode;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			role="tab"
			aria-selected={active}
			onClick={onClick}
			className={`border-b-2 px-1 py-3 text-sm font-semibold transition ${active ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
		>
			{children}
		</button>
	);
}
