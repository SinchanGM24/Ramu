import { Card } from "@/components/ui/card";
import type { ReportScale } from "../types";

const details: Record<string, string> = {
	BB: "Belum Berkembang",
	MB: "Mulai Berkembang",
	BSH: "Berkembang Sesuai Harapan",
	BSB: "Berkembang Sangat Baik",
};

export function ScaleGuide({ scales }: { scales: ReportScale[] }) {
	return (
		<Card>
			<h2 className="font-bold">Keterangan penilaian</h2>
			<p className="mt-1 text-sm text-slate-600">
				Pilih satu radio pada setiap baris indikator. Nilai disimpan otomatis.
			</p>
			<div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
				{scales.map((scale) => (
					<div key={scale.id} className="rounded-xl bg-slate-50 p-3">
						<b className="text-brand-700">{scale.code}</b>
						<p className="mt-1 text-sm text-slate-600">{details[scale.code] || scale.label}</p>
					</div>
				))}
			</div>
		</Card>
	);
}
