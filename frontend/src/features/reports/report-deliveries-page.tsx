"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock3, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { api } from "@/lib/api";

type Delivery = { id: string; recipient_phone: string; status: "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED"; attempt_count: number; failure_reason?: string | null; queued_at: string; guardian_name: string; relationship: string; version_number: number };
const statusCopy: Record<Delivery["status"], { label: string; className: string }> = {
  QUEUED: { label: "Menunggu dikirim", className: "bg-amber-50 text-amber-800" }, SENT: { label: "Terkirim", className: "bg-blue-50 text-blue-800" }, DELIVERED: { label: "Diterima", className: "bg-emerald-50 text-emerald-800" }, READ: { label: "Dibaca", className: "bg-violet-50 text-violet-800" }, FAILED: { label: "Gagal dikirim", className: "bg-red-50 text-red-800" },
};
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export function ReportDeliveriesPage({ reportId }: { reportId: string }) {
  const queryClient = useQueryClient();
  const deliveries = useQuery({ queryKey: ["reports", reportId, "deliveries"], queryFn: () => api<Delivery[]>(`/reports/${reportId}/deliveries`) });
  const retry = useMutation({ mutationFn: (deliveryId: string) => api(`/deliveries/${deliveryId}/retry`, { method: "POST" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports", reportId, "deliveries"] }) });
  const rows = deliveries.data ?? [];
  return <>
    <PageHeader eyebrow="Distribusi rapor" title="Status pengiriman kepada wali" description="Setiap pengiriman terkait dengan versi rapor yang telah diterbitkan. Pengiriman gagal dapat dimasukkan kembali ke antrean." action={<Link href={`/app/reports/${reportId}`}><Button variant="secondary">Kembali ke rapor</Button></Link>} />
    {deliveries.isLoading && <Card>Memuat status pengiriman…</Card>}
    {deliveries.isError && <Card><div className="flex gap-3 text-red-700"><AlertCircle className="mt-0.5 size-5 shrink-0" /><div><h2 className="font-bold">Status pengiriman tidak dapat dimuat</h2><p className="mt-1 text-sm">Periksa kembali akses Anda, lalu coba muat ulang.</p><Button className="mt-4" variant="secondary" onClick={() => deliveries.refetch()}>Coba lagi</Button></div></div></Card>}
    {!deliveries.isLoading && !deliveries.isError && rows.length === 0 && <Card className="py-10 text-center"><Clock3 className="mx-auto size-9 text-brand-600" /><h2 className="mt-3 font-bold text-slate-900">Belum ada kontak wali untuk dikirimi</h2><p className="mt-1 text-sm text-slate-500">Tambahkan kontak wali pada profil murid, lalu terbitkan versi rapor berikutnya.</p></Card>}
    {rows.length > 0 && <div className="space-y-4">{rows.map((delivery) => { const status = statusCopy[delivery.status]; return <Card key={delivery.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{delivery.guardian_name}</h2><span className="text-sm text-slate-500">{delivery.relationship}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span></div><p className="mt-2 text-sm text-slate-600">{delivery.recipient_phone} · Versi rapor {delivery.version_number}</p><p className="mt-1 text-xs text-slate-500">Masuk antrean: {formatDate(delivery.queued_at)} · Percobaan kirim: {delivery.attempt_count}</p>{delivery.failure_reason && <p className="mt-2 text-sm text-red-700">Alasan gagal: {delivery.failure_reason}</p>}</div>{delivery.status === "FAILED" ? <Button className="gap-2" disabled={retry.isPending} onClick={() => retry.mutate(delivery.id)}><RotateCcw size={16} />{retry.isPending ? "Memasukkan ke antrean…" : "Kirim ulang"}</Button> : <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><CheckCircle2 size={17} className="text-brand-600" />Status tercatat</span>}</Card>; })}</div>}
  </>;
}
