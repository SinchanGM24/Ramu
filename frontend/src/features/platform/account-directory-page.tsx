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
import { TenantAdminPasswordDialog } from "./components/tenant-admin-password-dialog";
import { PlatformPageHeader } from "./components/platform-page-header";
import { PlatformAccountActions } from "./components/platform-account-actions";
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
	const [selectedAdmin, setSelectedAdmin] = useState<PlatformAccount | null>(null);
	const [passwordError, setPasswordError] = useState("");
	const [actionError, setActionError] = useState("");
	const [actionMessage, setActionMessage] = useState("");
	const [isSavingPassword, setIsSavingPassword] = useState(false);
	const [confirmation, setConfirmation] = useState<{
		account: PlatformAccount;
		action: "revoke" | "status";
	} | null>(null);
	const [isConfirming, setIsConfirming] = useState(false);
	const debouncedSearch = useDebouncedValue(search);
	const accounts = useQuery({
		queryKey: ["platform-accounts", page, debouncedSearch, status, role],
		queryFn: () => {
			const params = new URLSearchParams({ page: String(page) });
			if (debouncedSearch) params.set("query", debouncedSearch);
			if (status) params.set("status", status);
			if (role) params.set("role", role);
			return api<Paginated<PlatformAccount>>(`/platform/accounts?${params}`);
		},
	});

	async function changeStatus(account: PlatformAccount) {
		if (account.role !== "SCHOOL_ADMIN") return;
		setActionError("");
		setActionMessage("");
		const isActive = !account.is_active;
		try {
			await api(`/platform/accounts/${account.id}/status`, {
				method: "PATCH",
				body: JSON.stringify({ isActive }),
			});
			await queryClient.invalidateQueries({ queryKey: ["platform-accounts"] });
			await queryClient.invalidateQueries({ queryKey: ["platform-overview"] });
			setActionMessage(
				`Akun ${account.email} berhasil ${isActive ? "diaktifkan" : "ditangguhkan"}.`,
			);
		} catch (cause) {
			setActionError(
				cause instanceof Error ? cause.message : "Status akun tidak dapat diperbarui.",
			);
		}
	}

	async function revoke(account: PlatformAccount) {
		if (account.role !== "SCHOOL_ADMIN") return;
		setActionError("");
		setActionMessage("");
		try {
			await api(`/platform/accounts/${account.id}/revoke-sessions`, { method: "POST" });
			setActionMessage(`Seluruh sesi ${account.email} berhasil dicabut.`);
		} catch (cause) {
			setActionError(cause instanceof Error ? cause.message : "Sesi akun tidak dapat dicabut.");
		}
	}

	async function confirmAccountAction() {
		if (!confirmation) return;
		setIsConfirming(true);
		try {
			if (confirmation.action === "status") await changeStatus(confirmation.account);
			else await revoke(confirmation.account);
			setConfirmation(null);
		} finally {
			setIsConfirming(false);
		}
	}

	async function updateAdminPassword(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!selectedAdmin || isSavingPassword) return;
		const form = new FormData(event.currentTarget);
		setPasswordError("");
		setIsSavingPassword(true);
		try {
			await api(`/platform/tenants/${selectedAdmin.school_id}/admin/${selectedAdmin.id}/password`, {
				method: "PATCH",
				body: JSON.stringify({
					password: form.get("password"),
					passwordConfirmation: form.get("passwordConfirmation"),
				}),
			});
			setSelectedAdmin(null);
			setActionMessage(
				`Sandi ${selectedAdmin.email} berhasil diperbarui. Seluruh sesi aktifnya telah dicabut.`,
			);
		} catch (cause) {
			setPasswordError(cause instanceof Error ? cause.message : "Sandi tidak dapat diperbarui.");
		} finally {
			setIsSavingPassword(false);
		}
	}

	return (
		<>
			<PlatformPageHeader
				title="Akun sekolah"
				description="Tinjau metadata akun sekolah. Tindakan akun hanya tersedia untuk Admin Sekolah; sandi, token, PIN, serta data anak tidak ditampilkan di platform."
			/>
			{actionError ? (
				<p
					role="alert"
					className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
				>
					{actionError}
				</p>
			) : null}
			{actionMessage ? (
				<p
					role="status"
					className="mb-5 rounded-xl border border-[#b9d8bf] bg-[#edf7ee] px-4 py-3 text-sm text-[#1d643e]"
				>
					{actionMessage}
				</p>
			) : null}
			{selectedAdmin ? (
				<TenantAdminPasswordDialog
					adminName={selectedAdmin.name}
					pending={isSavingPassword}
					error={passwordError}
					onClose={() => {
						if (isSavingPassword) return;
						setPasswordError("");
						setSelectedAdmin(null);
					}}
					onSubmit={updateAdminPassword}
				/>
			) : null}
			<ConfirmationDialog
				open={Boolean(confirmation)}
				title={
					confirmation?.action === "revoke"
						? "Cabut seluruh sesi"
						: confirmation?.account.is_active
							? "Tangguhkan akun Admin Sekolah"
							: "Aktifkan akun Admin Sekolah"
				}
				description={
					confirmation?.action === "revoke"
						? `Semua perangkat yang masuk sebagai ${confirmation.account.email} akan keluar dan perlu masuk kembali.`
						: confirmation?.account.is_active
							? `Akun ${confirmation?.account.email} tidak dapat masuk sampai diaktifkan kembali.`
							: `Akun ${confirmation?.account.email} dapat masuk kembali. Keanggotaan sekolahnya tidak diubah.`
				}
				confirmLabel={
					confirmation?.action === "revoke"
						? "Cabut sesi"
						: confirmation?.account.is_active
							? "Tangguhkan akun"
							: "Aktifkan akun"
				}
				confirmVariant={
					confirmation?.action === "status" && confirmation.account.is_active ? "danger" : "primary"
				}
				pending={isConfirming}
				onCancel={() => setConfirmation(null)}
				onConfirm={() => void confirmAccountAction()}
			/>
			<Card className="rounded-xl border-[#dfcdbf] bg-[#fffaf6] p-4 shadow-none sm:p-5">
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
										<td className="px-4 py-4 text-right">
											{account.role === "SCHOOL_ADMIN" ? (
												<div>
													<PlatformAccountActions
														isActive={account.is_active}
														onSetPassword={() => {
															setActionError("");
															setActionMessage("");
															setPasswordError("");
															setSelectedAdmin(account);
														}}
														onRevokeSessions={() => setConfirmation({ account, action: "revoke" })}
														onChangeStatus={() => setConfirmation({ account, action: "status" })}
													/>
													<Link
														href={`/platform/tenants/${account.school_id}`}
														className="mt-2 inline-block text-xs font-semibold text-[#765646] hover:underline"
													>
														Kelola tenant
													</Link>
												</div>
											) : (
												<span className="text-xs text-slate-500">Hanya baca</span>
											)}
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
						<article
							key={account.id}
							className="rounded-xl border border-[#dfcdbf] bg-[#fffaf6] p-4"
						>
							<p className="font-bold">{account.name}</p>
							<p className="mt-1 text-sm text-slate-500">{account.email}</p>
							<p className="mt-3 text-sm text-slate-700">
								{account.school_name} · {roleLabel[account.role]}
							</p>
							<span
								className={`mt-3 inline-flex rounded-md px-2 py-1 text-xs font-medium ${account.is_active ? "bg-[#e7f3e9] text-[#1d643e]" : "bg-[#fff4dc] text-[#8a5a12]"}`}
							>
								{account.is_active ? "Aktif" : "Ditangguhkan"}
							</span>
							{account.role === "SCHOOL_ADMIN" ? (
								<div className="mt-4 flex items-center justify-between gap-3">
									<PlatformAccountActions
										isActive={account.is_active}
										onSetPassword={() => {
											setActionError("");
											setActionMessage("");
											setPasswordError("");
											setSelectedAdmin(account);
										}}
										onRevokeSessions={() => setConfirmation({ account, action: "revoke" })}
										onChangeStatus={() => setConfirmation({ account, action: "status" })}
									/>
									<Link
										href={`/platform/tenants/${account.school_id}`}
										className="mt-3 inline-block text-xs font-semibold text-[#765646] hover:underline"
									>
										Kelola tenant
									</Link>
								</div>
							) : (
								<p className="mt-4 border-t border-[#ead9cc] pt-3 text-xs text-slate-500">
									Akun ini hanya dapat ditinjau dari platform.
								</p>
							)}
						</article>
					))}
				</div>
				<PaginationControls
					page={page}
					pageSize={15}
					total={accounts.data?.total ?? 0}
					onPageChange={setPage}
					activeClassName="bg-[#765646] text-[#fff9f4]"
				/>
			</Card>
		</>
	);
}
