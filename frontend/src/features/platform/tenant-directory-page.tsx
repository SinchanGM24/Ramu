"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { Paginated, Tenant } from "./types";

const inputClass =
	"w-full rounded-xl border border-[#dfe2d6] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50";
const labelStatus = (status: "ACTIVE" | "SUSPENDED") =>
	status === "ACTIVE" ? "Aktif" : "Ditangguhkan";

export function TenantDirectoryPage() {
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("");
	const [showCreate, setShowCreate] = useState(false);
	const [temporaryPassword, setTemporaryPassword] = useState("");
	const [error, setError] = useState("");
	const tenants = useQuery({
		queryKey: ["platform-tenants", page, search, status],
		queryFn: () =>
			api<Paginated<Tenant>>(
				`/platform/tenants?page=${page}&query=${encodeURIComponent(search)}&status=${status}`,
			),
	});

	async function setTenantStatus(tenant: Tenant) {
		const next = tenant.tenant_status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
		if (
			!window.confirm(
				`${next === "SUSPENDED" ? "Tangguhkan" : "Aktifkan kembali"} tenant ${tenant.name}?`,
			)
		)
			return;
		await api(`/platform/tenants/${tenant.id}/status`, {
			method: "PATCH",
			body: JSON.stringify({ status: next }),
		});
		await queryClient.invalidateQueries({ queryKey: ["platform-tenants"] });
		await queryClient.invalidateQueries({ queryKey: ["platform-overview"] });
	}

	async function createTenant(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		const form = new FormData(event.currentTarget);
		try {
			const result = await api<{ temporaryPassword: string }>("/platform/tenants", {
				method: "POST",
				body: JSON.stringify({
					schoolName: form.get("schoolName"),
					address: form.get("address"),
					phone: form.get("phone"),
					adminName: form.get("adminName"),
					adminEmail: form.get("adminEmail"),
				}),
			});
			setTemporaryPassword(result.temporaryPassword);
			setShowCreate(false);
			event.currentTarget.reset();
			await queryClient.invalidateQueries({ queryKey: ["platform-tenants"] });
			await queryClient.invalidateQueries({ queryKey: ["platform-overview"] });
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Tenant tidak dapat dibuat.");
		}
	}

	return (
		<>
			<PageHeader
				eyebrow="Operasional platform"
				title="Tenant sekolah"
				description="Kelola status tenant dan akun Admin Sekolah tanpa membuka isi data tenant."
				action={
					<Button
						onClick={() => {
							setShowCreate((value) => !value);
							setTemporaryPassword("");
						}}
					>
						Tambah tenant
					</Button>
				}
			/>
			{temporaryPassword ? (
				<Card className="mb-6 border-amber-300 bg-amber-50">
					<p className="font-bold text-amber-950">Sandi sementara Admin Sekolah</p>
					<p className="mt-2 text-sm text-amber-900">
						Salin dan kirimkan sekarang. Sandi ini tidak dapat dilihat kembali setelah halaman
						ditutup.
					</p>
					<code className="mt-4 block rounded-xl bg-white px-4 py-3 text-lg font-bold tracking-widest text-slate-950">
						{temporaryPassword}
					</code>
				</Card>
			) : null}
			{showCreate ? (
				<Card className="mb-6">
					<h2 className="font-bold text-slate-950">Buat tenant baru</h2>
					<form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={createTenant}>
						<label className="text-sm font-semibold">
							Nama sekolah
							<input required name="schoolName" className={`${inputClass} mt-1.5`} />
						</label>
						<label className="text-sm font-semibold">
							Nama Admin Sekolah
							<input required name="adminName" className={`${inputClass} mt-1.5`} />
						</label>
						<label className="text-sm font-semibold">
							Email Admin Sekolah
							<input required name="adminEmail" type="email" className={`${inputClass} mt-1.5`} />
						</label>
						<label className="text-sm font-semibold">
							Telepon (opsional)
							<input name="phone" className={`${inputClass} mt-1.5`} />
						</label>
						<label className="text-sm font-semibold md:col-span-2">
							Alamat (opsional)
							<input name="address" className={`${inputClass} mt-1.5`} />
						</label>
						{error ? (
							<p role="alert" className="md:col-span-2 text-sm text-red-700">
								{error}
							</p>
						) : null}
						<div className="flex gap-2 md:col-span-2">
							<Button type="submit">Buat tenant</Button>
							<Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
								Batal
							</Button>
						</div>
					</form>
				</Card>
			) : null}
			<Card>
				<div className="flex flex-col gap-3 border-b border-[#e7e7dc] pb-4 md:flex-row">
					<label className="relative flex-1">
						<span className="sr-only">Cari tenant</span>
						<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
						<input
							className={`${inputClass} pl-9`}
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
							placeholder="Cari nama sekolah, slug, atau email admin"
						/>
					</label>
					<select
						aria-label="Filter status tenant"
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
				</div>
				<div className="mt-4 hidden md:block">
					<table className="w-full table-fixed text-left text-sm">
						<colgroup>
							<col className="w-[29%]" />
							<col className="w-[25%]" />
							<col className="w-[12%]" />
							<col className="w-[16%]" />
							<col className="w-[18%]" />
						</colgroup>
						<thead className="border-b border-[#e7e7dc] text-xs uppercase tracking-[0.12em] text-slate-500">
							<tr>
								<th className="px-4 py-3">Sekolah</th>
								<th className="px-4 py-3">Admin Sekolah</th>
								<th className="px-4 py-3">Akun / murid</th>
								<th className="px-4 py-3">Status</th>
								<th className="px-4 py-3 text-right">Aksi</th>
							</tr>
						</thead>
						<tbody>
							{tenants.isLoading ? (
								<tr>
									<td colSpan={5} className="px-4 py-10 text-center text-slate-500">
										Memuat tenant…
									</td>
								</tr>
							) : tenants.isError ? (
								<tr>
									<td colSpan={5} className="px-4 py-10 text-center text-red-700">
										Tenant tidak dapat dimuat.
									</td>
								</tr>
							) : tenants.data?.data.length ? (
								tenants.data.data.map((tenant) => (
									<tr key={tenant.id} className="border-b border-slate-100 hover:bg-brand-50/50">
										<td className="px-4 py-4">
											<Link
												href={`/platform/tenants/${tenant.id}`}
												className="font-semibold text-slate-900 hover:text-brand-700 hover:underline"
											>
												{tenant.name}
											</Link>
											<p className="mt-1 truncate text-xs text-slate-500">{tenant.slug}</p>
										</td>
										<td className="px-4 py-4">
											<p>{tenant.admin_name ?? "—"}</p>
											<p className="mt-1 truncate text-xs text-slate-500">
												{tenant.admin_email ?? "—"}
											</p>
										</td>
										<td className="px-4 py-4 text-slate-600">
											{tenant.account_count} akun
											<br />
											{tenant.student_count} murid
										</td>
										<td className="px-4 py-4">
											<span
												className={`rounded-full px-2.5 py-1 text-xs font-bold ${tenant.tenant_status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
											>
												{labelStatus(tenant.tenant_status)}
											</span>
										</td>
										<td className="px-4 py-4 text-right">
											<Button
												variant={tenant.tenant_status === "ACTIVE" ? "danger" : "secondary"}
												onClick={() => setTenantStatus(tenant)}
											>
												{tenant.tenant_status === "ACTIVE" ? "Tangguhkan" : "Aktifkan"}
											</Button>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={5} className="px-4 py-10 text-center text-slate-500">
										Tenant tidak ditemukan.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
				<div className="mt-4 space-y-3 md:hidden">
					{tenants.data?.data.map((tenant) => (
						<article key={tenant.id} className="rounded-xl border border-slate-200 p-4">
							<div className="flex justify-between gap-3">
								<div>
									<Link
										href={`/platform/tenants/${tenant.id}`}
										className="font-bold hover:text-brand-700 hover:underline"
									>
										{tenant.name}
									</Link>
									<p className="mt-1 text-sm text-slate-500">
										{tenant.admin_email ?? "Admin belum tersedia"}
									</p>
								</div>
								<span className="text-xs font-bold">{labelStatus(tenant.tenant_status)}</span>
							</div>
							<p className="mt-3 text-sm text-slate-600">
								{tenant.account_count} akun · {tenant.student_count} murid
							</p>
							<Button
								className="mt-4 w-full"
								variant={tenant.tenant_status === "ACTIVE" ? "danger" : "secondary"}
								onClick={() => setTenantStatus(tenant)}
							>
								{tenant.tenant_status === "ACTIVE" ? "Tangguhkan" : "Aktifkan"}
							</Button>
						</article>
					))}
				</div>
				<PaginationControls
					page={page}
					pageSize={15}
					total={tenants.data?.total ?? 0}
					onPageChange={setPage}
				/>
			</Card>
		</>
	);
}
