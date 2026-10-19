"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { Paginated, PlatformAccount } from "./types";

const inputClass =
	"h-9 w-full rounded-lg border border-[#d7dfd7] bg-white px-3 text-sm outline-none transition focus:border-[#174b31] focus:ring-2 focus:ring-[#dcebe0]";
const roleLabel: Record<PlatformAccount["role"], string> = {
	SCHOOL_ADMIN: "Admin Sekolah",
	TEACHER: "Guru",
	PRINCIPAL: "Kepala Sekolah",
};

export function AccountDirectoryPage() {
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("");
	const [role, setRole] = useState("");
	const accounts = useQuery({
		queryKey: ["platform-accounts", page, search, status, role],
		queryFn: () => {
			const params = new URLSearchParams({ page: String(page) });
			if (search) params.set("query", search);
			if (status) params.set("status", status);
			if (role) params.set("role", role);
			return api<Paginated<PlatformAccount>>(`/platform/accounts?${params}`);
		},
	});

	async function changeStatus(account: PlatformAccount) {
		const isActive = !account.is_active;
		if (!window.confirm(`${isActive ? "Aktifkan kembali" : "Tangguhkan"} akun ${account.email}?`))
			return;
		await api(`/platform/accounts/${account.id}/status`, {
			method: "PATCH",
			body: JSON.stringify({ isActive }),
		});
		await queryClient.invalidateQueries({ queryKey: ["platform-accounts"] });
		await queryClient.invalidateQueries({ queryKey: ["platform-overview"] });
	}

	async function revoke(account: PlatformAccount) {
		if (!window.confirm(`Cabut seluruh sesi aktif ${account.email}?`)) return;
		await api(`/platform/accounts/${account.id}/revoke-sessions`, { method: "POST" });
	}

	return (
		<>
			<PageHeader
				eyebrow="Operasional platform"
				title="Akun sekolah"
				description="Tinjau metadata akun sekolah. Sandi, token, PIN, serta data anak tidak ditampilkan di platform."
			/>
			<Card className="rounded-xl border-[#e3e8e3] bg-white p-4 shadow-none sm:p-5">
				<div className="grid gap-3 pb-5 md:grid-cols-[minmax(0,1fr)_180px_190px]">
					<label className="relative">
						<span className="sr-only">Cari akun</span>
						<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
						<input
							className={`${inputClass} pl-9`}
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
							placeholder="Cari nama, email, atau sekolah"
						/>
					</label>
					<select
						aria-label="Filter status akun"
						className={inputClass}
						value={status}
						onChange={(event) => {
							setStatus(event.target.value);
							setPage(1);
						}}
					>
						<option value="">Semua status</option>
						<option value="ACTIVE">Aktif</option>
						<option value="SUSPENDED">Ditangguhkan</option>
					</select>
					<select
						aria-label="Filter peran akun"
						className={inputClass}
						value={role}
						onChange={(event) => {
							setRole(event.target.value);
							setPage(1);
						}}
					>
						<option value="">Semua peran</option>
						<option value="SCHOOL_ADMIN">Admin Sekolah</option>
						<option value="TEACHER">Guru</option>
						<option value="PRINCIPAL">Kepala Sekolah</option>
					</select>
				</div>
				<div className="hidden md:block">
					<table className="w-full table-fixed text-left text-sm">
						<colgroup>
							<col className="w-[23%]" />
							<col className="w-[24%]" />
							<col className="w-[16%]" />
							<col className="w-[13%]" />
							<col className="w-[24%]" />
						</colgroup>
						<thead className="border-b border-[#e7e7dc] text-xs font-medium text-slate-500">
							<tr>
								<th className="px-4 py-3">Akun</th>
								<th className="px-4 py-3">Tenant</th>
								<th className="px-4 py-3">Peran</th>
								<th className="px-4 py-3">Status</th>
								<th className="px-4 py-3 text-right">Aksi</th>
							</tr>
						</thead>
						<tbody>
							{accounts.isLoading ? (
								<tr>
									<td colSpan={5} className="px-4 py-10 text-center text-slate-500">
										Memuat akun…
									</td>
								</tr>
							) : accounts.isError ? (
								<tr>
									<td colSpan={5} className="px-4 py-10 text-center text-red-700">
										Akun tidak dapat dimuat.
									</td>
								</tr>
							) : accounts.data?.data.length ? (
								accounts.data.data.map((account) => (
									<tr
										key={account.id}
										className="border-b border-slate-100 transition-colors hover:bg-[#f5faf6]"
									>
										<td className="px-4 py-4">
											<p className="font-semibold">{account.name}</p>
											<p className="mt-1 truncate text-xs text-slate-500">{account.email}</p>
										</td>
										<td className="px-4 py-4 text-slate-700">{account.school_name}</td>
										<td className="px-4 py-4 text-slate-700">{roleLabel[account.role]}</td>
										<td className="px-4 py-4">
											<span
												className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${account.is_active ? "bg-[#e7f3e9] text-[#1d643e]" : "bg-[#fff4dc] text-[#8a5a12]"}`}
											>
												{account.is_active ? "Aktif" : "Ditangguhkan"}
											</span>
										</td>
										<td className="px-4 py-4">
											<div className="flex justify-end gap-2">
												<Button variant="secondary" onClick={() => revoke(account)}>
													Cabut sesi
												</Button>
												<Button
													variant={account.is_active ? "danger" : "secondary"}
													onClick={() => changeStatus(account)}
												>
													{account.is_active ? "Tangguhkan" : "Aktifkan"}
												</Button>
											</div>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={5} className="px-4 py-10 text-center text-slate-500">
										Akun tidak ditemukan.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
				<div className="space-y-3 md:hidden">
					{accounts.data?.data.map((account) => (
						<article key={account.id} className="rounded-xl border border-slate-200 p-4">
							<p className="font-bold">{account.name}</p>
							<p className="mt-1 text-sm text-slate-500">{account.email}</p>
							<p className="mt-3 text-sm text-slate-700">
								{account.school_name} · {roleLabel[account.role]}
							</p>
							<p className="mt-1 text-sm font-semibold">
								{account.is_active ? "Aktif" : "Ditangguhkan"}
							</p>
							<div className="mt-4 grid grid-cols-2 gap-2">
								<Button variant="secondary" onClick={() => revoke(account)}>
									Cabut sesi
								</Button>
								<Button
									variant={account.is_active ? "danger" : "secondary"}
									onClick={() => changeStatus(account)}
								>
									{account.is_active ? "Tangguhkan" : "Aktifkan"}
								</Button>
							</div>
						</article>
					))}
				</div>
				<PaginationControls
					page={page}
					pageSize={15}
					total={accounts.data?.total ?? 0}
					onPageChange={setPage}
				/>
			</Card>
		</>
	);
}
