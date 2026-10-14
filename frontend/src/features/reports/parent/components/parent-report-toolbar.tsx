import { Download, Printer } from "lucide-react";

type ParentReportToolbarProps = {
	studentName?: string;
	onDownload: () => void;
};

export function ParentReportToolbar({ studentName, onDownload }: ParentReportToolbarProps) {
	return (
		<header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dfe4da] bg-[#fffdf8]/95 px-4 py-3 shadow-[0_4px_16px_rgba(33,63,42,0.06)] backdrop-blur print:hidden sm:px-6">
			<div>
				<p className="text-xs font-bold text-brand-700">RAMU · RAPOR WALI</p>
				<b className="text-[#17251b]">{studentName || "Anak didik"}</b>
			</div>
			<div className="flex gap-2">
				<button
					onClick={onDownload}
					aria-label="Unduh PDF"
					className="rounded-xl p-2 text-brand-700 transition hover:bg-brand-50"
				>
					<Download size={19} />
				</button>
				<button
					onClick={() => window.print()}
					aria-label="Cetak rapor"
					className="rounded-xl p-2 text-brand-700 transition hover:bg-brand-50"
				>
					<Printer size={19} />
				</button>
			</div>
		</header>
	);
}
