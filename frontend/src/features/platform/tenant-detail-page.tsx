"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { TenantAdminPasswordDialog } from "./components/tenant-admin-password-dialog";
import { PlatformPageHeader } from "./components/platform-page-header";
import type { TenantDetail } from "./types";

const subscriptionPlanLabel: Record<string, string> = {
	TRIAL: "Masa percobaan",
	FREE: "Gratis",
	BASIC: "Dasar",
	PRO: "Pro",
};

const subscriptionStatusLabel: Record<string, string> = {
	TRIAL: "Masa percobaan",
	ACTIVE: "Aktif",
	PAST_DUE: "Menunggu pembayaran",
	CANCELED: "Dibatalkan",
	SUSPENDED: "Ditangguhkan",
};

export function TenantDetailPage({ id }: { id: string }) {
	const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
	const [isSavingPassword, setIsSavingPassword] = useState(false);
	const [passwordError, setPasswordError] = useState("");
	const [passwordSuccess, setPasswordSuccess] = useState("");
	const tenant = useQuery({
		queryKey: ["platform-tenant", id],
		queryFn: () => api<TenantDetail>(`/platform/tenants/${id}`),
	});
	const data = tenant.data;

	async function updateAdminPassword(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!data?.admin || isSavingPassword) return;
		const form = new FormData(event.currentTarget);
		setPasswordError("");
		setIsSavingPassword(true);
		try {
			await api(`/platform/tenants/${data.id}/admin/${data.admin.id}/password`, {
				method: "PATCH",
				body: JSON.stringify({
					password: form.get("password"),
					passwordConfirmation: form.get("passwordConfirmation"),
				}),
			});
			setIsPasswordDialogOpen(false);
			setPasswordSuccess(
				"Sandi Admin Sekolah berhasil diperbarui. Seluruh sesi aktifnya telah dicabut.",
			);
		} catch (cause) {
			setPasswordError(cause instanceof Error ? cause.message : "Sandi tidak dapat diperbarui.");
		} finally {
			setIsSavingPassword(false);
		}
	}
	if (tenant.isLoading) return <p className="text-sm text-slate-600">Memuat detail tenant…</p>;
	if (!data) return <Card className="text-red-700">Detail tenant tidak dapat dimuat.</Card>;

	return (
		<>
			<Link
				href="/platform/tenants"
				className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline"
			>
				<ArrowLeft size={16} /> Kembali ke tenant
			</Link>
			<PlatformPageHeader
				title={data.name}
				description="Informasi operasional tenant. Data murid, penilaian, raport, PDF, dan wali tidak tersedia di platform."
			/>
			{passwordSuccess ? (
				<p
					role="status"
					className="mb-5 rounded-xl border border-[#b9d8bf] bg-[#edf7ee] px-4 py-3 text-sm text-[#1d643e]"
				>
					{passwordSuccess}
				</p>
			) : null}
			{isPasswordDialogOpen && data.admin ? (
				<TenantAdminPasswordDialog
					adminName={data.admin.name}
					pending={isSavingPassword}
					error={passwordError}
					onClose={() => {
						if (isSavingPassword) return;
						setPasswordError("");
						setIsPasswordDialogOpen(false);
					}}
					onSubmit={updateAdminPassword}
				/>
			) : null}
			<div className="grid gap-5 lg:grid-cols-2">
				<Card className="border-[#dfcdbf] bg-[#fffaf6] shadow-none">
					<h2 className="font-bold text-slate-950">Profil sekolah</h2>
					<dl className="mt-4 space-y-3 text-sm">
						<div>
							<dt className="text-slate-500">Slug</dt>
							<dd className="mt-1 font-medium">{data.slug}</dd>
						</div>
						<div>
							<dt className="text-slate-500">Alamat</dt>
							<dd className="mt-1 font-medium">{data.address || "Belum diisi"}</dd>
						</div>
						<div>
							<dt className="text-slate-500">Telepon</dt>
							<dd className="mt-1 font-medium">{data.phone || "Belum diisi"}</dd>
						</div>
						<div>
							<dt className="text-slate-500">Dibuat</dt>
							<dd className="mt-1 font-medium">
								{new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
									new Date(data.createdAt),
								)}
							</dd>
						</div>
					</dl>
				</Card>
				<Card className="border-[#dfcdbf] bg-[#fffaf6] shadow-none">
					<h2 className="font-bold text-slate-950">Admin dan status</h2>
					<dl className="mt-4 space-y-3 text-sm">
						<div>
							<dt className="text-slate-500">Admin Sekolah</dt>
							<dd className="mt-1 font-medium">{data.admin?.name || "Belum tersedia"}</dd>
							<dd className="text-slate-600">{data.admin?.email || ""}</dd>
						</div>
						{data.admin ? (
							<div className="border-t border-[#ead9cc] pt-4">
								<dt className="text-slate-500">Pemulihan akses</dt>
								<dd className="mt-1 text-sm leading-6 text-slate-600">
									Hanya sandi Admin Sekolah tenant ini yang dapat diatur ulang dari platform.
								</dd>
								<Button
									type="button"
									variant="secondary"
									className="mt-3"
									onClick={() => {
										setPasswordError("");
										setPasswordSuccess("");
										setIsPasswordDialogOpen(true);
									}}
								>
									Atur ulang sandi
								</Button>
							</div>
						) : null}
						<div>
							<dt className="text-slate-500">Status tenant</dt>
							<dd
								className={`mt-1 inline-flex rounded-md px-2 py-1 text-xs font-medium ${data.status === "ACTIVE" ? "bg-[#e7f3e9] text-[#1d643e]" : "bg-[#fff4dc] text-[#8a5a12]"}`}
							>
								{data.status === "ACTIVE" ? "Aktif" : "Ditangguhkan"}
							</dd>
						</div>
						<div>
							<dt className="text-slate-500">Langganan (hanya baca)</dt>
							<dd className="mt-1 font-medium">
								{data.subscription
									? `${subscriptionPlanLabel[data.subscription.plan] ?? data.subscription.plan} — ${subscriptionStatusLabel[data.subscription.status] ?? data.subscription.status}`
									: "Belum tersedia"}
							</dd>
						</div>
					</dl>
				</Card>
				<Card className="border-[#dfcdbf] bg-[#fffaf6] shadow-none lg:col-span-2">
					<h2 className="font-bold text-slate-950">Agregat tenant</h2>
					<p className="mt-1 text-sm text-slate-600">
						Ringkasan jumlah tanpa membuka data individual.
					</p>
					<div className="mt-4 grid gap-3 sm:grid-cols-2">
						<div className="rounded-xl bg-[#f5e9df] p-4">
							<p className="text-sm text-slate-600">Akun aktif pada tenant</p>
							<p className="mt-1 text-2xl font-bold">{data.accountCount}</p>
						</div>
						<div className="rounded-xl bg-[#f5e9df] p-4">
							<p className="text-sm text-slate-600">Murid terdaftar</p>
							<p className="mt-1 text-2xl font-bold">{data.studentCount}</p>
						</div>
					</div>
				</Card>
			</div>
		</>
	);
}
