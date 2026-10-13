"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ModalDialog } from "@/components/shared/modal-dialog";
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
	const qc = useQueryClient();
	const [teacher, setTeacher] = useState("");
	const [error, setError] = useState("");
	const [isActive, setIsActive] = useState(period.is_active);
	const staff = useQuery({
		queryKey: ["staff", "assignment-options"],
		queryFn: () => api<{ items: StaffMember[] }>("/staff?limit=100"),
	});
	const assignments = useQuery({
		queryKey: ["assignments", period.id],
		queryFn: () => api<TeacherAssignment[]>(`/staff/class-periods/${period.id}/assignments`),
	});
	const refresh = () =>
		Promise.all([
			qc.invalidateQueries({ queryKey: ["assignments", period.id] }),
			qc.invalidateQueries({ queryKey: ["academic", "class-periods"] }),
		]);
	async function add() {
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
	async function end(id: string) {
		try {
			await api(`/staff/class-periods/${period.id}/assignments/${id}/end`, { method: "POST" });
			await refresh();
		} catch (reason) {
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
			await qc.invalidateQueries({ queryKey: ["academic", "class-periods"] });
		} catch (reason) {
			setIsActive(!checked);
			setError(reason instanceof Error ? reason.message : "Status kelas tidak dapat diperbarui.");
		}
	}
	async function remove() {
		if (!window.confirm(`Hapus kelas "${period.name}"?`)) return;
		try {
			await api(`/academic/class-groups/${period.class_group_id}`, { method: "DELETE" });
			await qc.invalidateQueries({ queryKey: ["academic", "class-periods"] });
			onClose();
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Kelas tidak dapat dihapus.");
		}
	}
	return (
		<ModalDialog
			title={`Kelola ${period.name}`}
			description="Penugasan guru hanya berlaku untuk kelas pada tahun ajaran ini."
			onClose={onClose}
			labelledBy="class-management-title"
			contentClassName="mx-auto my-8 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
			bodyClassName="mt-5"
			closeOnEscape
			closeOnBackdrop
			closeButton={
				<button
					type="button"
					onClick={onClose}
					aria-label="Tutup dialog"
					className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
				>
					×
				</button>
			}
		>
			<p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
				{period.student_count || 0} murid ditempatkan pada kelas ini.
			</p>
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
			<h3 className="mt-5 font-semibold">Guru yang ditugaskan</h3>
			<div className="mt-3 flex flex-wrap gap-2">
				{assignments.data
					?.filter((item) => !item.ended_at)
					.map((item) => (
						<span
							key={item.id}
							className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm text-brand-800"
						>
							{item.teacher_name}
							<button
								onClick={() => void end(item.id)}
								aria-label={`Akhiri penugasan ${item.teacher_name}`}
							>
								×
							</button>
						</span>
					))}
				{!assignments.data?.some((item) => !item.ended_at) && (
					<p className="text-sm text-slate-500">Belum ada guru ditugaskan.</p>
				)}
			</div>
			<div className="mt-4 flex gap-2">
				<select
					value={teacher}
					onChange={(event) => setTeacher(event.target.value)}
					className={`${inputClass} min-w-0 flex-1`}
				>
					<option value="">Pilih guru</option>
					{staff.data?.items
						?.filter((account) => account.role === "TEACHER" && account.is_active)
						.map((account) => (
							<option key={account.id} value={account.id}>
								{account.name}
							</option>
						))}
				</select>
				<Button variant="secondary" disabled={!teacher} onClick={() => void add()}>
					Tambah
				</Button>
			</div>
			{error && <p className="mt-3 text-sm text-red-700">{error}</p>}
			<div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
				<Button
					variant="ghost"
					className="text-red-600 hover:bg-red-50 hover:text-red-700"
					onClick={() => void remove()}
				>
					Hapus kelas
				</Button>
			</div>
		</ModalDialog>
	);
}
