"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardCheck, RotateCcw } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";

type ReviewReport = {
  id: string;
  status: "SUBMITTED" | "IN_REVIEW" | "REVISION_REQUIRED" | "APPROVED";
  submitted_at: string | null;
  student_name: string;
  semester_name: string;
};
type PublishedReport = { parentAccess: { link: string; pin: string } };

const status: Record<ReviewReport["status"], { label: string; tone: "green" | "amber" | "slate" }> = {
  SUBMITTED: { label: "Menunggu ditinjau", tone: "amber" },
  IN_REVIEW: { label: "Sedang ditinjau", tone: "amber" },
  REVISION_REQUIRED: { label: "Perlu revisi", tone: "slate" },
  APPROVED: { label: "Disetujui", tone: "green" },
};

function submittedAt(value: string | null) {
  if (!value) return "Belum tersedia";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function ReportReviewPage() {
  const queryClient = useQueryClient();
  const [openRevisionFor, setOpenRevisionFor] = useState<string>();
  const [revisionNote, setRevisionNote] = useState("");
  const [notice, setNotice] = useState<string>();
  const [parentAccess, setParentAccess] = useState<{ link: string; pin: string }>();
  const reports = useQuery({ queryKey: ["reports", "review-queue"], queryFn: () => api<ReviewReport[]>("/reports/review-queue") });
  const transition = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: "review" | "revision" | "approve"; note?: string }) =>
      api(`/reports/${id}/transition`, { method: "POST", body: JSON.stringify({ action, note }) }),
    onSuccess: (_, variables) => {
      setNotice(variables.action === "review" ? "Rapor mulai ditinjau." : variables.action === "approve" ? "Rapor telah disetujui." : "Rapor dikembalikan untuk direvisi.");
      setOpenRevisionFor(undefined);
      setRevisionNote("");
      queryClient.invalidateQueries({ queryKey: ["reports", "review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
  const publish = useMutation({ mutationFn: (id: string) => api<PublishedReport>(`/reports/${id}/publish`, { method: "POST" }), onSuccess: (published) => { setNotice("Rapor berhasil diterbitkan dan dikunci sebagai versi final."); setParentAccess(published.parentAccess); queryClient.invalidateQueries({ queryKey: ["reports"] }); queryClient.invalidateQueries({ queryKey: ["reports", "review-queue"] }); } });
  const error = transition.error instanceof ApiError ? transition.error.message : transition.error ? "Tindakan tidak dapat diproses. Coba lagi." : undefined;
  const queue = reports.data ?? [];

  function submitRevision(id: string) {
    const note = revisionNote.trim();
    if (!note) return;
    transition.mutate({ id, action: "revision", note });
  }

  return <>
    <PageHeader eyebrow="Rapor" title="Tinjauan rapor" description="Periksa rapor yang dikirim guru, minta revisi bila perlu, lalu setujui rapor yang sudah layak." />
    {notice && <div role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</div>}
    {parentAccess && <Card className="mb-4 border-brand-200 bg-brand-50"><h2 className="font-bold text-slate-900">Akses wali siap dibagikan</h2><p className="mt-1 text-sm text-slate-600">Simpan PIN ini sekarang. Demi keamanan, PIN tidak akan ditampilkan kembali dari halaman ini.</p><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-medium text-slate-600">Tautan rapor</dt><dd className="mt-1 break-all rounded-lg bg-white p-3 font-semibold text-brand-700">{parentAccess.link}</dd></div><div><dt className="font-medium text-slate-600">PIN wali</dt><dd className="mt-1 rounded-lg bg-white p-3 text-xl font-bold tracking-[0.35em] text-slate-900">{parentAccess.pin}</dd></div></dl><Button className="mt-4" variant="secondary" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${parentAccess.link}\nPIN: ${parentAccess.pin}`)}>Salin tautan dan PIN</Button></Card>}
    {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
    {reports.isLoading ? <Card>Memuat antrean rapor…</Card> : reports.isError ? <Card><p className="text-red-700">Antrean rapor tidak dapat dimuat.</p><Button className="mt-4" variant="secondary" onClick={() => reports.refetch()}>Coba lagi</Button></Card> : queue.length === 0 ? <Card className="py-10 text-center"><ClipboardCheck className="mx-auto size-9 text-brand-600" /><h2 className="mt-3 font-bold text-slate-900">Belum ada rapor untuk ditinjau</h2><p className="mt-1 text-sm text-slate-500">Rapor yang dikirim guru akan muncul di sini.</p></Card> : <div className="space-y-4">{queue.map((report) => <Card key={report.id}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{report.student_name}</h2><StatusBadge tone={status[report.status].tone}>{status[report.status].label}</StatusBadge></div><p className="mt-1 text-sm text-slate-500">{report.semester_name} · Dikirim {submittedAt(report.submitted_at)}</p></div>
        <div className="flex flex-wrap gap-2">
          {report.status === "SUBMITTED" && <Button disabled={transition.isPending} onClick={() => transition.mutate({ id: report.id, action: "review" })}>Mulai tinjau</Button>}
          {report.status === "IN_REVIEW" && <><Button disabled={transition.isPending} variant="secondary" onClick={() => { setOpenRevisionFor(openRevisionFor === report.id ? undefined : report.id); setRevisionNote(""); }}><RotateCcw className="mr-1 size-4" />Minta revisi</Button><Button disabled={transition.isPending} onClick={() => transition.mutate({ id: report.id, action: "approve" })}><Check className="mr-1 size-4" />Setujui rapor</Button></>}
          {report.status === "APPROVED" && <Button disabled={publish.isPending} onClick={() => publish.mutate(report.id)}>Terbitkan rapor</Button>}
        </div>
      </div>
      {openRevisionFor === report.id && <div className="mt-4 border-t border-slate-100 pt-4"><label className="block text-sm font-semibold text-slate-800">Catatan revisi<textarea value={revisionNote} onChange={(event) => setRevisionNote(event.target.value)} maxLength={1000} className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-500" placeholder="Jelaskan bagian yang perlu diperbaiki…" /></label><div className="mt-3 flex gap-2"><Button variant="secondary" onClick={() => { setOpenRevisionFor(undefined); setRevisionNote(""); }}>Batal</Button><Button disabled={!revisionNote.trim() || transition.isPending} onClick={() => submitRevision(report.id)}>Kirim permintaan revisi</Button></div></div>}
    </Card>)}</div>}
  </>;
}
