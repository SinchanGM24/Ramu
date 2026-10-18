"use client";

import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, UsersRound } from "lucide-react";
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
	const [saving, setSaving] = useState(false);
	const debouncedSearch = useDebouncedValue(search);
	useEffect(() => {
		setPage(1);
	}, [debouncedSearch]);
	const staff = useQuery({
		queryKey: ["staff", page, debouncedSearch],
		queryFn: ({ signal }) =>
			api<StaffResponse>(
				`/staff?page=${page}&limit=${pageSize}&search=${encodeURIComponent(debouncedSearch)}`,
				{ signal },
			),
	});
	async function create(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (saving) return;
		const form = event.currentTarget;
		const data = new FormData(form);
		setSaving(true);
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
		} finally {
			setSaving(false);
		}
	}
	async function update(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!editing || saving) return;
		const data = new FormData(event.currentTarget);
		setSaving(true);
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
		} finally {
			setSaving(false);
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
				<p className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</p>
			)}
			<Card className="overflow-hidden p-0">
				<div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e7e7dc] px-5 py-5 sm:px-6">
					<div className="flex items-start gap-3">
						<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
							<UsersRound size={19} />
						</span>
						<div>
							<h2 className="font-bold text-[#17251b]">Daftar akun sekolah</h2>
							<p className="mt-1 text-sm text-[#637065]">
								Atur akses orang yang bekerja di sekolah Anda.
							</p>
						</div>
					</div>
					<span className="rounded-lg bg-[#f0f4ed] px-3 py-1.5 text-xs font-semibold tabular-nums text-[#466052]">
						{staff.data?.total || 0} akun
					</span>
				</div>
				<div className="px-5 py-4 sm:px-6">
					<label className="relative block max-w-md">
						<span className="sr-only">Cari akun</span>
						<Search
							aria-hidden="true"
							className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7b867d]"
						/>
						<input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Cari nama, email, atau nomor telepon"
							className="w-full rounded-xl border border-[#dfe3d9] bg-[#fffefa] py-2.5 pl-10 pr-3 text-sm text-[#17251b] outline-none transition placeholder:text-[#899188] focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
						/>
					</label>
					<StaffDirectoryTable accounts={staff.data?.items} onEdit={setEditing} />
					<PaginationControls
						page={page}
						pageSize={pageSize}
						total={staff.data?.total || 0}
						onPageChange={setPage}
					/>
				</div>
			</Card>
			{creating && (
				<StaffFormDialog pending={saving} onClose={() => setCreating(false)} onSubmit={create} />
			)}
			{editing && (
				<StaffFormDialog
					editing={editing}
					pending={saving}
					onClose={() => setEditing(null)}
					onSubmit={update}
				/>
			)}
		</>
	);
}
