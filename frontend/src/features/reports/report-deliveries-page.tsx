"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock3, RotateCcw, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { api } from "@/lib/api";

type Delivery = { id: string; recipient_phone: string; status: "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED"; attempt_count: number; failure_reason?: string | null; queued_at: string; guardian_name: string; relationship: string; version_number: number };
type Recipient = { id: string; name: string; relationship: string; phone: string; is_primary: boolean };
const statusCopy: Record<Delivery["status"], { label: string; className: string }> = {
  QUEUED: { label: "Menunggu dikirim", className: "bg-amber-50 text-amber-800" }, SENT: { label: "Terkirim", className: "bg-blue-50 text-blue-800" }, DELIVERED: { label: "Diterima", className: "bg-emerald-50 text-emerald-800" }, READ: { label: "Dibaca", className: "bg-violet-50 text-violet-800" }, FAILED: { label: "Gagal dikirim", className: "bg-red-50 text-red-800" },
};
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export function ReportDeliveriesPage({ reportId }: { reportId: string }) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const deliveries = useQuery({ queryKey: ["reports", reportId, "deliveries"], queryFn: () => api<Delivery[]>(`/reports/${reportId}/deliveries`) });
  const recipients = useQuery({ queryKey: ["reports", reportId, "delivery-recipients"], queryFn: () => api<Recipient[]>(`/reports/${reportId}/delivery-recipients`) });
  useEffect(() => {
    if (!recipients.data) return;
    setSelectedIds((current) => current.length ? current.filter((id) => recipients.data!.some((recipient) => recipient.id === id)) : recipients.data!.map((recipient) => recipient.id));
  }, [recipients.data]);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["reports", reportId, "deliveries"] });
  const queue = useMutation({ mutationFn: () => api<Delivery[]>(`/reports/${reportId}/deliveries`, { method: "POST", body: JSON.stringify({ guardianContactIds: selectedIds }) }), onSuccess: (created) => { setNotice(`${created.length} kontak masuk ke antrean pengiriman.`); void refresh(); }, onError: (error) => setNotice(error instanceof Error ? error.message : "Pengiriman belum dapat dimasukkan ke antrean.") });
  const retry = useMutation({ mutationFn: (deliveryId: string) => api(`/deliveries/${deliveryId}/retry`, { method: "POST" }), onSuccess: () => { setNotice("Pengiriman kembali masuk ke antrean."); void refresh(); }, onError: () => setNotice("Pengiriman belum dapat dimasukkan kembali ke antrean.") });
  const rows = deliveries.data ?? [];
  const recipientRows = recipients.data ?? [];
  function toggleRecipient(id: string) { setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }

  return <>
    <PageHeader eyebrow="Distribusi rapor" title="Kirim rapor kepada wali" description="Pilih kontak penerima, masukkan ke antrean, lalu pantau status setiap pengiriman." action={<Link href={`/app/reports/${reportId}/preview`}><Button variant="secondary">Lihat rapor</Button></Link>} />
    {notice && <p role="status" className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${queue.isError || retry.isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{notice}</p>}
    {recipients.isLoading ? <Card className="mb-4">Memuat kontak penerima…</Card> : recipients.isError ? <Card className="mb-4"><p className="text-red-700">Kontak penerima tidak dapat dimuat.</p><Button className="mt-4" variant="secondary" onClick={() => recipients.refetch()}>Coba lagi</Button></Card> : <Card className="mb-5"><div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-bold text-slate-900">Pilih penerima</h2><p className="mt-1 text-sm text-slate-500">Hanya kontak yang ditandai sebagai penerima rapor pada profil murid yang muncul di sini.</p></div>{recipientRows.length > 0 && <button type="button" onClick={() => setSelectedIds(selectedIds.length === recipientRows.length ? [] : recipientRows.map((recipient) => recipient.id))} className="text-sm font-semibold text-brand-700 hover:text-brand-800">{selectedIds.length === recipientRows.length ? "Batalkan semua" : "Pilih semua"}</button>}</div>{recipientRows.length ? <div className="mt-3 divide-y divide-slate-100">{recipientRows.map((recipient) => { const selected = selectedIds.includes(recipient.id); return <button type="button" key={recipient.id} role="checkbox" aria-checked={selected} onClick={() => toggleRecipient(recipient.id)} className={`flex w-full items-center gap-3 px-1 py-3 text-left ${selected ? "text-slate-900" : "text-slate-500"}`}><span aria-hidden="true" className={`grid size-5 shrink-0 place-items-center rounded border ${selected ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white"}`}>{selected && "✓"}</span><span className="min-w-0 flex-1"><span className="font-semibold">{recipient.name}{recipient.is_primary && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">Kontak utama</span>}</span><span className="mt-0.5 block text-sm text-slate-500">{recipient.relationship} · {recipient.phone}</span></span></button>; })}</div> : <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Belum ada kontak wali yang ditandai sebagai penerima rapor. Kelola kontak wali pada profil murid terlebih dahulu.</div>}<div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">{selectedIds.length} kontak dipilih</p><Button disabled={!selectedIds.length || queue.isPending} onClick={() => queue.mutate()}><Send className="mr-1.5 size-4" />{queue.isPending ? "Memasukkan ke antrean…" : "Masukkan ke antrean"}</Button></div></Card>}
    {deliveries.isLoading && <Card>Memuat status pengiriman…</Card>}
    {deliveries.isError && <Card><div className="flex gap-3 text-red-700"><AlertCircle className="mt-0.5 size-5 shrink-0" /><div><h2 className="font-bold">Status pengiriman tidak dapat dimuat</h2><p className="mt-1 text-sm">Periksa kembali akses Anda, lalu coba muat ulang.</p><Button className="mt-4" variant="secondary" onClick={() => deliveries.refetch()}>Coba lagi</Button></div></div></Card>}
    {!deliveries.isLoading && !deliveries.isError && rows.length === 0 && <Card className="py-10 text-center"><Clock3 className="mx-auto size-9 text-brand-600" /><h2 className="mt-3 font-bold text-slate-900">Belum ada pengiriman dalam antrean</h2><p className="mt-1 text-sm text-slate-500">Pilih kontak wali di atas, lalu masukkan ke antrean pengiriman.</p></Card>}
    {rows.length > 0 && <section><h2 className="mb-3 text-lg font-bold text-slate-900">Riwayat pengiriman</h2><div className="space-y-4">{rows.map((delivery) => { const status = statusCopy[delivery.status]; return <Card key={delivery.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{delivery.guardian_name}</h3><span className="text-sm text-slate-500">{delivery.relationship}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span></div><p className="mt-2 text-sm text-slate-600">{delivery.recipient_phone} · Versi rapor {delivery.version_number}</p><p className="mt-1 text-xs text-slate-500">Masuk antrean: {formatDate(delivery.queued_at)} · Percobaan kirim: {delivery.attempt_count}</p>{delivery.failure_reason && <p className="mt-2 text-sm text-red-700">Alasan gagal: {delivery.failure_reason}</p>}</div>{delivery.status === "FAILED" ? <Button className="gap-2" disabled={retry.isPending} onClick={() => retry.mutate(delivery.id)}><RotateCcw size={16} />{retry.isPending ? "Memasukkan ke antrean…" : "Kirim ulang"}</Button> : <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><CheckCircle2 size={17} className="text-brand-600" />Status tercatat</span>}</Card>; })}</div></section>}
  </>;
}
