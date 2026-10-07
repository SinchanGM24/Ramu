"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type ParentReport = { assessments?: { description: string; code: string }[]; narratives?: { name: string; content: string }[] };

export function ParentReportViewer({ token }: { token: string }) {
  const [pin, setPin] = useState("");
  const [data, setData] = useState<ParentReport>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function loadSession() {
    const result = await api<{ report: ParentReport }>("/parent/report");
    setData(result.report);
  }
  useEffect(() => { loadSession().catch(() => undefined); }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try { await api("/parent/verify", { method: "POST", body: JSON.stringify({ token, pin }) }); await loadSession(); }
    catch { setError("PIN atau tautan tidak valid."); }
    finally { setLoading(false); }
  }
  async function downloadPdf() {
    setError("");
    setDownloading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/parent/report-pdf`, { credentials: "include" });
      if (!response.ok) throw new Error("unduh gagal");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "rapor-anak.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch { setError("PDF rapor belum dapat diunduh. Silakan coba lagi."); }
    finally { setDownloading(false); }
  }

  if (data) return <main className="min-h-screen bg-brand-50 p-5"><article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-soft"><div className="flex justify-between gap-4"><h1 className="text-xl font-bold">Laporan Perkembangan Anak Didik</h1><div className="flex gap-3"><button className="text-sm font-semibold text-brand-700" disabled={downloading} onClick={downloadPdf}>{downloading ? "Menyiapkan PDF…" : "Unduh PDF"}</button><button className="text-sm font-semibold text-brand-700" onClick={() => window.print()}>Cetak</button></div></div>{error && <p className="mt-4 text-sm text-red-700">{error}</p>}<section className="mt-6 space-y-2">{data.assessments?.map((item, index) => <div key={index} className="flex justify-between border-b py-2 text-sm"><span>{item.description}</span><strong>{item.code}</strong></div>)}</section><section className="mt-6 space-y-4">{data.narratives?.map((item, index) => <div key={index}><h2 className="font-bold">{item.name}</h2><p className="text-sm">{item.content}</p></div>)}</section></article></main>;
  return <main className="grid min-h-screen place-items-center bg-brand-50 p-5"><form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft"><p className="text-sm font-bold text-brand-700">RAMU · AKSES WALI</p><h1 className="mt-1 text-xl font-bold">Rapor murid</h1><label className="mt-6 block text-sm font-semibold">PIN enam digit<input required value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" className="mt-2 w-full rounded-xl border p-3 text-center text-xl tracking-[.4em]" /></label>{error && <p className="mt-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="mt-4 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white disabled:opacity-50">{loading ? "Memeriksa akses…" : "Buka rapor"}</button></form></main>;
}
