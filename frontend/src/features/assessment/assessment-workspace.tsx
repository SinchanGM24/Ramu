"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

type Semester = { id: string; name: string; academic_year_name: string };
type Data = {
	student: { name: string };
	scales: { id: string; code: string }[];
	indicators: { id: string; description: string; area_name: string; scale_option_id?: string }[];
};

export function AssessmentWorkspace({ studentId }: { studentId: string }) {
	const queryClient = useQueryClient();
	const [semesterId, setSemesterId] = useState("");
	const semesters = useQuery({
		queryKey: ["academic", "semesters"],
		queryFn: () => api<Semester[]>("/academic/semesters"),
	});
	useEffect(() => {
		if (!semesterId && semesters.data?.[0]) setSemesterId(semesters.data[0].id);
	}, [semesterId, semesters.data]);
	const work = useQuery({
		queryKey: ["assessment", studentId, semesterId],
		enabled: Boolean(semesterId),
		queryFn: () => api<Data>(`/assessment/students/${studentId}?semesterId=${semesterId}`),
	});
	const completedIndicators =
		work.data?.indicators.filter((indicator) => indicator.scale_option_id).length ?? 0;
	const totalIndicators = work.data?.indicators.length ?? 0;

	async function choose(indicatorId: string, scaleOptionId: string) {
		if (!semesterId) return;
		await api(`/assessment/students/${studentId}`, {
			method: "POST",
			body: JSON.stringify({ semesterId, indicatorId, scaleOptionId }),
		});
		await queryClient.invalidateQueries({ queryKey: ["assessment", studentId, semesterId] });
	}

	if (!semesters.isLoading && !semesters.data?.length)
		return (
			<>
				<PageHeader
					title="Penilaian murid"
					description="Semester I dan Semester II dibuat otomatis bersama tahun ajaran."
				/>
				<Card className="space-y-3">
					<p className="font-semibold">Tahun ajaran belum tersedia.</p>
					<Link href="/app/academic">
						<Button>Buat tahun ajaran</Button>
					</Link>
				</Card>
			</>
		);

	return (
		<>
			<PageHeader
				eyebrow="Penilaian individual"
				title={work.data?.student.name || "Memuat murid…"}
				description="Pilih semester dan satu tingkat perkembangan untuk setiap indikator. Perubahan tersimpan otomatis."
			/>
			<Card className="mb-5 flex flex-col gap-5 bg-[linear-gradient(112deg,#f4f7ed_0%,#fffdf8_60%,#eef5ec_100%)] sm:flex-row sm:items-end sm:justify-between">
				<label htmlFor="assessment-semester" className="text-sm font-semibold text-[#35443a]">
					Semester aktif
				</label>
				<select
					id="assessment-semester"
					value={semesterId}
					onChange={(event) => setSemesterId(event.target.value)}
					className="mt-2 w-full rounded-xl border border-[#dfe3d9] bg-[#fffefa] px-3 py-2.5 text-sm text-[#17251b] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:max-w-sm"
				>
					{semesters.data?.map((semester) => (
						<option key={semester.id} value={semester.id}>
							{semester.name} · {semester.academic_year_name}
						</option>
					))}
				</select>
				<div className="mt-4 flex items-center gap-3 rounded-2xl border border-brand-100 bg-[#fffdf8]/90 px-4 py-3 sm:mt-0">
					<span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
						<ClipboardCheck size={19} />
					</span>
					<div>
						<p className="text-sm font-semibold text-[#17251b]">
							{completedIndicators}/{totalIndicators} indikator
						</p>
						<p className="text-xs text-[#637065]">sudah dinilai</p>
					</div>
				</div>
			</Card>
			<div className="space-y-3">
				{work.data?.indicators.map((indicator) => (
					<Card
						key={indicator.id}
						className="border-[#e5e7dc] bg-[#fffefa] transition hover:border-brand-100 hover:shadow-soft"
					>
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-700">
									{indicator.area_name}
								</p>
								<p className="mt-1 font-semibold leading-6 text-[#17251b]">
									{indicator.description}
								</p>
							</div>
							{indicator.scale_option_id ? (
								<CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
							) : null}
						</div>
						<div className="mt-4 flex flex-wrap gap-2">
							{work.data.scales.map((scale) => (
								<button
									key={scale.id}
									onClick={() => void choose(indicator.id, scale.id)}
									className={`rounded-xl px-4 py-2 text-sm font-bold transition ${indicator.scale_option_id === scale.id ? "bg-brand-700 text-white shadow-[0_6px_14px_rgba(23,75,49,0.16)]" : "bg-[#f0f3ed] text-[#5d695f] hover:bg-brand-50 hover:text-brand-800"}`}
								>
									{scale.code}
								</button>
							))}
						</div>
					</Card>
				))}
				{work.data?.indicators.length === 0 && (
					<Card>Indikator penilaian belum tersedia. Muat ulang halaman beberapa saat lagi.</Card>
				)}
			</div>
		</>
	);
}
