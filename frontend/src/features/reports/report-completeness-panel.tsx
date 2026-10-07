"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Completeness = { complete: boolean; missingAssessments: string[]; missingNarratives: string[]; missingSemesterData: boolean };

export function ReportCompletenessPanel({ reportId }: { reportId: string }) {
  const queryClient = useQueryClient();
  const completeness = useQuery({ queryKey: ["report-completeness", reportId], queryFn: () => api<Completeness>(`/reports/${reportId}/completeness`) });
  const submit = useMutation({ mutationFn: () => api(`/reports/${reportId}/workspace/submit`, { method: "POST" }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["report-completeness", reportId] }); queryClient.invalidateQueries({ queryKey: ["report-workspace", reportId] }); } });
  if (completeness.isLoading) return <Card className="mb-4 text-sm text-slate-500">Memeriksa kelengkapan rapor…</Card>;
  if (completeness.isError || !completeness.data) return null;
  const data = completeness.data;
  const missing = [...data.missingAssessments.map((item) => `Penilaian: ${item}`), ...data.missingNarratives.map((item) => `Narasi: ${item}`), ...(data.missingSemesterData ? ["Data pertumbuhan dan kehadiran"] : [])];
  return <Card className={`mb-4 ${data.complete ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className={data.complete ? "text-emerald-700" : "text-amber-700"}>{data.complete ? <CheckCircle2 /> : <CircleAlert />}</span><div><h2 className="font-bold text-slate-900">{data.complete ? "Rapor siap dikirim untuk ditinjau" : "Rapor belum lengkap"}</h2><p className="mt-1 text-sm text-slate-600">{data.complete ? "Semua indikator, narasi, dan data akhir semester sudah tersedia." : "Lengkapi data berikut sebelum mengirim rapor."}</p>{!data.complete && <ul className="mt-2 list-disc pl-5 text-xs text-slate-600">{missing.slice(0, 5).map((item) => <li key={item}>{item}</li>)}{missing.length > 5 && <li>dan {missing.length - 5} data lainnya</li>}</ul>}</div></div><Button disabled={!data.complete || submit.isPending} onClick={() => submit.mutate()}>{submit.isPending ? "Mengirim…" : "Kirim untuk ditinjau"}</Button></div>{submit.isError && <p className="mt-3 text-sm text-red-700">Rapor tidak dapat dikirim. Periksa kembali kelengkapannya.</p>}</Card>;
}
