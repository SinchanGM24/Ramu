"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

type PortfolioItem = { id: string; original_filename: string; content_type: string; byte_size: number; caption?: string | null; included_in_report: boolean; created_at: string };
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function ReportPortfolioPage({ reportId }: { reportId: string }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File>();
  const [caption, setCaption] = useState("");
  const [include, setInclude] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const items = useQuery({ queryKey: ["report-portfolio", reportId], queryFn: () => api<PortfolioItem[]>(`/reports/${reportId}/portfolio`) });
  async function upload() {
    if (!file) return;
    setSaving(true); setError("");
    try { if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") { const form = new FormData(); form.append("file", file); form.append("caption", caption); form.append("includedInReport", String(include)); const response = await fetch(`${apiUrl}/api/reports/${reportId}/portfolio`, { method: "POST", credentials: "include", body: form }); if (!response.ok) throw new Error(); } setFile(undefined); setCaption(""); await queryClient.invalidateQueries({ queryKey: ["report-portfolio", reportId] }); }
    catch { setError("Foto portfolio tidak dapat diunggah. Gunakan JPG, PNG, atau WebP dengan ukuran maksimal 5 MB."); }
    finally { setSaving(false); }
  }
  return <><PageHeader eyebrow="Portfolio murid" title="Dokumentasi perkembangan" description="Simpan foto dan keterangan pendukung secara aman. Hanya item yang dipilih yang akan dimasukkan pada rapor terbit." action={<Link href={`/app/reports/${reportId}`}><Button variant="secondary">Kembali ke rapor</Button></Link>} />
    <Card><div className="grid gap-4 sm:grid-cols-2"><label className="grid min-h-36 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50 p-4 text-center"><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0])} /><ImagePlus className="size-8 text-brand-600" /><span className="mt-2 text-sm font-semibold text-brand-700">{file ? file.name : "Pilih foto portfolio"}</span><span className="mt-1 text-xs text-slate-500">JPG, PNG, atau WebP · maksimal 5 MB</span></label><div><label className="block text-sm font-semibold">Keterangan foto<textarea value={caption} onChange={(event) => setCaption(event.target.value.slice(0, 500))} maxLength={500} className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Ceritakan kegiatan atau perkembangan yang terlihat…" /></label><label className="mt-3 flex items-center gap-2 text-sm"><input checked={include} onChange={(event) => setInclude(event.target.checked)} type="checkbox" /> Sertakan pada rapor terbit</label><Button className="mt-4 gap-2" disabled={!file || saving} onClick={upload}><Upload size={16} />{saving ? "Mengunggah…" : "Unggah foto"}</Button></div></div>{error && <p className="mt-4 text-sm text-red-700">{error}</p>}</Card>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.data?.map((item) => <Card key={item.id}><p className="truncate font-semibold text-slate-900">{item.original_filename}</p><p className="mt-1 text-xs text-slate-500">{Math.ceil(item.byte_size / 1024)} KB · {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.created_at))}</p>{item.caption && <p className="mt-3 text-sm text-slate-600">{item.caption}</p>}<p className="mt-3 text-xs font-semibold text-brand-700">{item.included_in_report ? "Disertakan pada rapor" : "Tidak disertakan pada rapor"}</p></Card>)}</div>{items.data?.length === 0 && <Card className="mt-5 py-10 text-center text-sm text-slate-500">Belum ada foto portfolio.</Card>}
  </>;
}
