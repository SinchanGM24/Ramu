"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { TenantDetail } from "./types";

export function TenantDetailPage({ id }: { id: string }) {
	const tenant = useQuery({
		queryKey: ["platform-tenant", id],
		queryFn: () => api<TenantDetail>(`/platform/tenants/${id}`),
	});
	const data = tenant.data;
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
			<PageHeader
				eyebrow="Metadata tenant"
				title={data.name}
				description="Informasi operasional tenant. Data murid, penilaian, raport, PDF, dan wali tidak tersedia di platform."
			/>
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
						<div>
							<dt className="text-slate-500">Status tenant</dt>
							<dd className="mt-1 font-medium">
								{data.status === "ACTIVE" ? "Aktif" : "Ditangguhkan"}
							</dd>
						</div>
						<div>
							<dt className="text-slate-500">Langganan (hanya baca)</dt>
							<dd className="mt-1 font-medium">
								{data.subscription
									? `${data.subscription.plan} · ${data.subscription.status}`
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
