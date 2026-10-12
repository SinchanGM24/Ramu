"use client";

import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api";
import { StaffDirectoryTable } from "./components/staff-directory-table";
import { StaffFormDialog } from "./components/staff-form-dialog";
import type { StaffMember, StaffResponse } from "./types";

const pageSize = 5;
export function StaffPage() {
	const queryClient = useQueryClient();
	const [error, setError] = useState("");
	const [editing, setEditing] = useState<StaffMember | null>(null);
	const [creating, setCreating] = useState(false);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const debouncedSearch = useDebouncedValue(search);
	useEffect(() => {
		setPage(1);
	}, [debouncedSearch]);
	const staff = useQuery({
		queryKey: ["staff", page, debouncedSearch],
		queryFn: () =>
			api<StaffResponse>(
				`/staff?page=${page}&limit=${pageSize}&search=${encodeURIComponent(debouncedSearch)}`,
			),
	});
	async function create(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const data = new FormData(form);
		try {
			await api("/staff", {
				method: "POST",
				body: JSON.stringify({
					name: data.get("name"),
					email: data.get("email"),
					phone: data.get("phone") || undefined,
					role: data.get("role"),
					password: data.get("password"),
				}),
			});
			form.reset();
			setCreating(false);
			await queryClient.invalidateQueries({ queryKey: ["staff"] });
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Akun tidak dapat dibuat.");
		}
	}
	async function update(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!editing) return;
		const data = new FormData(event.currentTarget);
		try {
			await api(`/staff/${editing.id}`, {
				method: "PATCH",
				body: JSON.stringify({
					name: data.get("name"),
					phone: data.get("phone") || undefined,
					role: data.get("role"),
					isActive: data.get("isActive") === "true",
					password: data.get("password") || undefined,
				}),
			});
			setEditing(null);
			await queryClient.invalidateQueries({ queryKey: ["staff"] });
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Akun tidak dapat diperbarui.");
		}
	}
	return (
		<>
			<PageHeader
				eyebrow="Pengaturan sekolah"
				title="Kelola akun"
				description="Buat dan perbarui nama, peran, kata sandi, serta status akun sekolah."
				action={
					<Button
						onClick={() => {
							setError("");
							setCreating(true);
						}}
					>
						<Plus size={16} />
						Tambah akun
					</Button>
				}
			/>
			{error && (
				<p className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
					{error}
				</p>
			)}
			<Card>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="font-bold">Daftar akun</h2>
					<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
						{staff.data?.total || 0} akun
					</span>
				</div>
				<input
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					placeholder="Cari nama, email, atau nomor telepon"
					className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
				/>
				<StaffDirectoryTable accounts={staff.data?.items} onEdit={setEditing} />
				<PaginationControls
					page={page}
					pageSize={pageSize}
					total={staff.data?.total || 0}
					onPageChange={setPage}
				/>
			</Card>
			{creating && <StaffFormDialog onClose={() => setCreating(false)} onSubmit={create} />}
			{editing && (
				<StaffFormDialog editing={editing} onClose={() => setEditing(null)} onSubmit={update} />
			)}
		</>
	);
}
