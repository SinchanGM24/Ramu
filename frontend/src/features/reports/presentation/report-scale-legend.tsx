export const scales = ["BB", "MB", "BSH", "BSB"];
export const scaleCopy: Record<string, string> = {
	BB: "Belum Berkembang",
	MB: "Mulai Berkembang",
	BSH: "Berkembang Sesuai Harapan",
	BSB: "Berkembang Sangat Baik",
};

export function ReportScaleLegend() {
	return (
		<div className="mt-4 grid gap-2 border border-slate-400 p-3 text-xs sm:grid-cols-4">
			{scales.map((scale) => (
				<span key={scale}>
					<b>{scale}</b> — {scaleCopy[scale]}
				</span>
			))}
		</div>
	);
}
