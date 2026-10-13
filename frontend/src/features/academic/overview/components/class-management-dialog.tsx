"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, UserMinus, UsersRound } from "lucide-react";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import type { ClassPeriod, StaffMember, TeacherAssignment } from "../types";

const inputClass =
	"w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export function ClassManagementDialog({
	period,
	onClose,
}: {
	period: ClassPeriod;
	onClose: () => void;
}) {
	const queryClient = useQueryClient();
	const [teacher, setTeacher] = useState("");
	const [error, setError] = useState("");
	const [isActive, setIsActive] = useState(period.is_active);
	const [assignmentToEnd, setAssignmentToEnd] = useState<TeacherAssignment | null>(null);
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
	const staff = useQuery({
		queryKey: ["staff", "assignment-options"],
		queryFn: () => api<{ items: StaffMember[] }>("/staff?limit=100"),
	});
	const assignments = useQuery({
		queryKey: ["assignments", period.id],
		queryFn: () => api<TeacherAssignment[]>(`/staff/class-periods/${period.id}/assignments`),
	});
	const activeAssignments = (assignments.data ?? []).filter((assignment) => !assignment.ended_at);
	const availableTeachers = (staff.data?.items ?? []).filter(
		(account) =>
			account.role === "TEACHER" &&
			account.is_active &&
			!activeAssignments.some((assignment) => assignment.teacher_user_id === account.id),
	);

	const refresh = () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: ["assignments", period.id] }),
			queryClient.invalidateQueries({ queryKey: ["academic", "class-periods"] }),
		]);

	async function addTeacher() {
		if (!teacher) return;
		try {
			await api(`/staff/class-periods/${period.id}/assignments`, {
				method: "POST",
				body: JSON.stringify({ teacherUserId: teacher }),
			});
			setTeacher("");
			await refresh();
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Guru tidak dapat ditugaskan.");
		}
	}

	async function endAssignment(assignmentId: string) {
		try {
			await api(`/staff/class-periods/${period.id}/assignments/${assignmentId}/end`, {
				method: "POST",
			});
			setAssignmentToEnd(null);
			await refresh();
		} catch (reason) {
			setAssignmentToEnd(null);
			setError(reason instanceof Error ? reason.message : "Penugasan tidak dapat diakhiri.");
		}
	}

	async function updateStatus(checked: boolean) {
		setIsActive(checked);
		try {
			await api(`/academic/class-groups/${period.class_group_id}`, {
				method: "POST",
				body: JSON.stringify({ name: period.name, isActive: checked }),
			});
			await queryClient.invalidateQueries({ queryKey: ["academic", "class-periods"] });
		} catch (reason) {
			setIsActive(!checked);
			setError(reason instanceof Error ? reason.message : "Status kelas tidak dapat diperbarui.");
		}
	}

	async function removeClass() {
		try {
			await api(`/academic/class-groups/${period.class_group_id}`, { method: "DELETE" });
			await queryClient.invalidateQueries({ queryKey: ["academic", "class-periods"] });
			setDeleteConfirmationOpen(false);
			onClose();
		} catch (reason) {
			setDeleteConfirmationOpen(false);
			setError(reason instanceof Error ? reason.message : "Kelas tidak dapat dihapus.");
		}
	}

	return (
		<>
			<ModalDialog
				eyebrow="Kelas tahun ajaran"
				title={`Kelola ${period.name}`}
				description="Atur guru yang bekerja pada kelas ini untuk tahun ajaran yang sedang dipilih."
				onClose={onClose}
				labelledBy="class-management-title"
				contentClassName="mx-auto my-8 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
				bodyClassName="mt-5"
				closeOnEscape
				closeOnBackdrop
			>
				<div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
					<span className="grid size-9 place-items-center rounded-lg bg-white text-brand-700 shadow-sm">
						<UsersRound className="size-4" />
					</span>
					<p>
						<span className="font-semibold text-slate-800">{period.student_count || 0} murid</span>{" "}
						saat ini ditempatkan pada kelas ini.
					</p>
				</div>

				<div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3">
					<div>
						<p className="text-sm font-semibold text-slate-700">Status kelas</p>
						<p className="text-xs text-slate-500">
							{isActive ? "Kelas dapat digunakan" : "Kelas tidak dapat digunakan"}
						</p>
					</div>
					<Switch
						checked={isActive}
						onChange={(checked) => void updateStatus(checked)}
						aria-label="Ubah status kelas"
					/>
				</div>

				<section className="mt-6">
					<div className="flex items-center justify-between gap-3">
						<div>
							<h3 className="font-semibold text-slate-900">Guru yang ditugaskan</h3>
							<p className="mt-1 text-sm text-slate-500">
								Semua guru aktif dapat mengisi rapor murid pada kelas ini.
							</p>
						</div>
						<span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
							{activeAssignments.length} guru
						</span>
					</div>
					{activeAssignments.length ? (
						<div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
							{activeAssignments.map((assignment) => (
								<div
									key={assignment.id}
									className="flex items-center justify-between gap-3 px-3 py-3"
								>
									<p className="min-w-0 truncate text-sm font-semibold text-slate-800">
										{assignment.teacher_name}
									</p>
									<Button
										type="button"
										variant="ghost"
										className="min-h-9 shrink-0 px-2.5 text-slate-500 hover:bg-red-50 hover:text-red-700"
										onClick={() => setAssignmentToEnd(assignment)}
									>
										<UserMinus className="size-4" />
										Akhiri
									</Button>
								</div>
							))}
						</div>
					) : (
						<p className="mt-3 rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
							Belum ada guru yang ditugaskan pada kelas ini.
						</p>
					)}
				</section>

				<section className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
					<label
						htmlFor="class-management-teacher"
						className="text-sm font-semibold text-slate-800"
					>
						Tugaskan guru
					</label>
					<p className="mt-1 text-sm text-slate-500">
						Pilih guru aktif yang belum ditugaskan pada kelas ini.
					</p>
					<div className="mt-3 flex flex-col gap-2 sm:flex-row">
						<select
							id="class-management-teacher"
							value={teacher}
							onChange={(event) => setTeacher(event.target.value)}
							className={`${inputClass} min-w-0 flex-1 bg-white`}
						>
							<option value="">Pilih guru</option>
							{availableTeachers.map((account) => (
								<option key={account.id} value={account.id}>
									{account.name}
								</option>
							))}
						</select>
						<Button variant="secondary" disabled={!teacher} onClick={() => void addTeacher()}>
							<Plus className="size-4" />
							Tugaskan
						</Button>
					</div>
				</section>

				{error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
				<section className="mt-6 flex flex-col gap-3 border-t border-red-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h3 className="text-sm font-semibold text-red-800">Tindakan berisiko</h3>
						<p className="mt-1 text-sm text-slate-500">
							Hapus kelas hanya jika kelas ini tidak lagi diperlukan.
						</p>
					</div>
					<Button
						type="button"
						variant="danger"
						className="shrink-0"
						onClick={() => setDeleteConfirmationOpen(true)}
					>
						<Trash2 className="size-4" />
						Hapus kelas
					</Button>
				</section>
			</ModalDialog>
			<ConfirmationDialog
				open={Boolean(assignmentToEnd)}
				title="Akhiri penugasan guru?"
				description={`Guru ${assignmentToEnd?.teacher_name ?? "ini"} tidak lagi dapat mengelola rapor kelas ${period.name}.`}
				confirmLabel="Akhiri penugasan"
				confirmVariant="danger"
				onCancel={() => setAssignmentToEnd(null)}
				onConfirm={() => {
					if (assignmentToEnd) void endAssignment(assignmentToEnd.id);
				}}
			/>
			<ConfirmationDialog
				open={deleteConfirmationOpen}
				title={`Hapus ${period.name}?`}
				description="Kelas yang sudah memiliki penempatan murid atau riwayat akademik tidak dapat dihapus."
				confirmLabel="Hapus kelas"
				confirmVariant="danger"
				onCancel={() => setDeleteConfirmationOpen(false)}
				onConfirm={() => void removeClass()}
			/>
		</>
	);
}
