"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { api } from "@/lib/api";
import type { PlatformOverview } from "./types";

const numberFormat = new Intl.NumberFormat("id-ID");

function activityLabel(action: string) {
	const labels: Record<string, string> = {
		"platform.bootstrap": "Super Admin awal dibuat",
		"platform.tenant_created": "Tenant dibuat",
		"platform.tenant_suspended": "Tenant ditangguhkan",
		"platform.tenant_reactivated": "Tenant diaktifkan kembali",
		"platform.account_suspended": "Akun ditangguhkan",
		"platform.account_reactivated": "Akun diaktifkan kembali",
		"platform.account_sessions_revoked": "Seluruh sesi akun dicabut",
	};
	return labels[action] ?? "Aktivitas platform";
}

export function PlatformDashboardPage() {
	const overview = useQuery({
		queryKey: ["platform-overview"],
		queryFn: () => api<PlatformOverview>("/platform/overview"),
	});
	const data = overview.data;
	const statistics = [
		["Tenant aktif", data?.activeTenants ?? 0, "Tenant dapat menggunakan ruang kerja."],
		["Tenant ditangguhkan", data?.suspendedTenants ?? 0, "Akses sekolah dan wali diblokir."],
		["Akun sekolah aktif", data?.activeAccounts ?? 0, "Tidak termasuk akun platform."],
		[
			"Akun sekolah ditangguhkan",
			data?.suspendedAccounts ?? 0,
			"Sesi akun dicabut saat ditangguhkan.",
		],
	];

	return (
		<>
			<PageHeader
				eyebrow="Operasional platform"
				title="Ringkasan RAMU"
				description="Pantau tenant dan akun sekolah tanpa membuka data murid, penilaian, atau raport."
			/>
			{overview.isError ? (
				<Card className="border-red-200 text-red-700">
					Ringkasan tidak dapat dimuat. Muat ulang halaman untuk mencoba kembali.
				</Card>
			) : null}
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{statistics.map(([label, value, description]) => (
					<Card key={label as string} className="p-5">
						<p className="text-sm font-medium text-slate-600">{label}</p>
						<p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
							{overview.isLoading ? "—" : numberFormat.format(value as number)}
						</p>
						<p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
					</Card>
				))}
			</div>
			<Card className="mt-6">
				<h2 className="font-bold text-slate-950">Aktivitas operasional terakhir</h2>
				<p className="mt-1 text-sm text-slate-600">
					Log ini tidak menyimpan kata sandi, token, PIN, atau data anak.
				</p>
				<div className="mt-4 divide-y divide-slate-100">
					{data?.recentActivity.length ? (
						data.recentActivity.map((activity) => (
							<div
								key={activity.id}
								className="flex items-center justify-between gap-4 py-3 text-sm"
							>
								<span className="font-medium text-slate-800">{activityLabel(activity.action)}</span>
								<time className="shrink-0 text-slate-500">
									{new Intl.DateTimeFormat("id-ID", {
										dateStyle: "medium",
										timeStyle: "short",
									}).format(new Date(activity.createdAt))}
								</time>
							</div>
						))
					) : (
						<p className="py-8 text-center text-sm text-slate-500">
							Belum ada aktivitas operasional.
						</p>
					)}
				</div>
			</Card>
		</>
	);
}
