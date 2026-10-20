"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api";
import { TenantCreateDialog } from "./components/tenant-create-dialog";
import { PlatformPageHeader } from "./components/platform-page-header";
import type { Paginated, Tenant } from "./types";

const inputClass =
	"h-9 w-full rounded-lg border border-[#d7dfd7] bg-white px-3 text-sm outline-none transition focus:border-[#174b31] focus:ring-2 focus:ring-[#dcebe0]";
const labelStatus = (status: "ACTIVE" | "SUSPENDED") =>
	status === "ACTIVE" ? "Aktif" : "Ditangguhkan";

export function TenantDirectoryPage() {
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("");
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [temporaryPassword, setTemporaryPassword] = useState("");
	const [error, setError] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [copyFeedback, setCopyFeedback] = useState("");
	const [tenantForStatusChange, setTenantForStatusChange] = useState<Tenant | null>(null);
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
	const [actionError, setActionError] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const tenants = useQuery({
		queryKey: ["platform-tenants", page, debouncedSearch, status],
		queryFn: () => {
			const params = new URLSearchParams({ page: String(page) });
			if (debouncedSearch) params.set("query", debouncedSearch);
			if (status) params.set("status", status);
			return api<Paginated<Tenant>>(`/platform/tenants?${params}`);
		},
	});

	async function setTenantStatus(tenant: Tenant) {
		const next = tenant.tenant_status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
		setIsUpdatingStatus(true);
		setActionError("");
		try {
			await api(`/platform/tenants/${tenant.id}/status`, {
				method: "PATCH",
				body: JSON.stringify({ status: next }),
			});
			await queryClient.invalidateQueries({ queryKey: ["platform-tenants"] });
			await queryClient.invalidateQueries({ queryKey: ["platform-overview"] });
			setTenantForStatusChange(null);
		} catch (cause) {
			setActionError(
				cause instanceof Error ? cause.message : "Status tenant tidak dapat diperbarui.",
			);
		} finally {
			setIsUpdatingStatus(false);
		}
	}

	async function createTenant(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (isCreating) return;
		setError("");
		const form = new FormData(event.currentTarget);
		setIsCreating(true);
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
			setCopyFeedback("");
			setIsCreateDialogOpen(false);
			event.currentTarget.reset();
			await queryClient.invalidateQueries({ queryKey: ["platform-tenants"] });
			await queryClient.invalidateQueries({ queryKey: ["platform-overview"] });
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Tenant tidak dapat dibuat.");
		} finally {
			setIsCreating(false);
		}
	}

	async function copyTemporaryPassword() {
		try {
			await navigator.clipboard.writeText(temporaryPassword);
			setCopyFeedback("Sandi sementara berhasil disalin.");
		} catch {
			setCopyFeedback("Sandi sementara tidak dapat disalin. Salin secara manual.");
		}
	}

	return (
		<>
			<PlatformPageHeader
				title="Tenant sekolah"
				description="Kelola status tenant dan akun Admin Sekolah tanpa membuka isi data tenant."
				action={
					<Button
						className="bg-[#765646] hover:bg-[#68483a]"
						onClick={() => {
							setError("");
							setIsCreateDialogOpen(true);
						}}
					>
						Tambah tenant
					</Button>
				}
			/>
			{temporaryPassword ? (
				<Card className="mb-6 border-[#d9baa3] bg-[#f8ece3] shadow-none">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<p role="status" className="font-bold text-[#5f4032]">
								Tenant berhasil dibuat
							</p>
							<p className="mt-1 text-sm leading-6 text-[#745d51]">
								Berikan sandi sementara ini kepada Admin Sekolah sekarang. Setelah kartu ditutup,
								RAMU tidak dapat menampilkannya kembali.
							</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							onClick={() => {
								setTemporaryPassword("");
								setCopyFeedback("");
							}}
						>
							Saya sudah menyimpan
						</Button>
					</div>
					<code className="mt-4 block rounded-xl border border-[#e4cdbd] bg-[#fffaf6] px-4 py-3 text-lg font-bold tracking-widest text-[#4e3428]">
						{temporaryPassword}
					</code>
					<div className="mt-3 flex justify-end">
						<Button type="button" variant="secondary" onClick={() => void copyTemporaryPassword()}>
							Salin sandi
						</Button>
					</div>
					{copyFeedback ? (
						<p role="status" className="mt-2 text-right text-sm text-[#6b4534]">
							{copyFeedback}
						</p>
					) : null}
				</Card>
			) : null}
			{isCreateDialogOpen ? (
				<TenantCreateDialog
					pending={isCreating}
					error={error}
					onClose={() => {
						if (isCreating) return;
						setError("");
						setIsCreateDialogOpen(false);
					}}
					onSubmit={createTenant}
				/>
			) : null}
			<ConfirmationDialog
				open={Boolean(tenantForStatusChange)}
				title={
					tenantForStatusChange?.tenant_status === "ACTIVE"
						? "Tangguhkan tenant"
						: "Aktifkan tenant"
				}
				description={
					tenantForStatusChange
						? tenantForStatusChange.tenant_status === "ACTIVE"
							? `Tenant ${tenantForStatusChange.name} tidak dapat diakses oleh staf, wali, atau tautan raport sampai diaktifkan kembali.`
							: `Tenant ${tenantForStatusChange.name} kembali dapat diakses. Data dan versi raport tidak diubah.`
						: ""
				}
				confirmLabel={
					tenantForStatusChange?.tenant_status === "ACTIVE"
						? "Tangguhkan tenant"
						: "Aktifkan tenant"
				}
				confirmVariant={tenantForStatusChange?.tenant_status === "ACTIVE" ? "danger" : "primary"}
				pending={isUpdatingStatus}
				onCancel={() => setTenantForStatusChange(null)}
				onConfirm={() => tenantForStatusChange && void setTenantStatus(tenantForStatusChange)}
			/>
			{actionError ? (
				<p
					role="alert"
					className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
				>
					{actionError}
				</p>
			) : null}
			<Card className="rounded-xl border-[#dfcdbf] bg-[#fffaf6] p-4 shadow-none sm:p-5">
				<div className="flex flex-col gap-3 pb-5 md:flex-row">
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
				<div className="hidden md:block">
					<table className="w-full table-fixed text-left text-sm">
						<colgroup>
							<col className="w-[29%]" />
							<col className="w-[25%]" />
							<col className="w-[12%]" />
							<col className="w-[16%]" />
							<col className="w-[18%]" />
						</colgroup>
						<thead className="border-b border-[#e7e7dc] text-xs font-medium text-slate-500">
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
									<tr
										key={tenant.id}
										className="border-b border-slate-100 transition-colors hover:bg-[#f5faf6]"
									>
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
												className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${tenant.tenant_status === "ACTIVE" ? "bg-[#e7f3e9] text-[#1d643e]" : "bg-[#fff4dc] text-[#8a5a12]"}`}
											>
												{labelStatus(tenant.tenant_status)}
											</span>
										</td>
										<td className="px-4 py-4 text-right">
											<Button
												variant={tenant.tenant_status === "ACTIVE" ? "danger" : "secondary"}
												onClick={() => setTenantForStatusChange(tenant)}
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
				<div className="space-y-3 md:hidden">
					{tenants.data?.data.map((tenant) => (
						<article
							key={tenant.id}
							className="rounded-xl border border-[#dfcdbf] bg-[#fffaf6] p-4"
						>
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
								<span
									className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${tenant.tenant_status === "ACTIVE" ? "bg-[#e7f3e9] text-[#1d643e]" : "bg-[#fff4dc] text-[#8a5a12]"}`}
								>
									{labelStatus(tenant.tenant_status)}
								</span>
							</div>
							<p className="mt-3 text-sm text-slate-600">
								{tenant.account_count} akun · {tenant.student_count} murid
							</p>
							<Button
								className="mt-4 w-full"
								variant={tenant.tenant_status === "ACTIVE" ? "danger" : "secondary"}
								onClick={() => setTenantForStatusChange(tenant)}
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
					activeClassName="bg-[#765646] text-[#fff9f4]"
				/>
			</Card>
		</>
	);
}
