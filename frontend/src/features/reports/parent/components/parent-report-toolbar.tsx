import { Download, Printer } from "lucide-react";

type ParentReportToolbarProps = {
	studentName?: string;
	onDownload: () => void;
};

export function ParentReportToolbar({ studentName, onDownload }: ParentReportToolbarProps) {
	return (
		<header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3 print:hidden">
			<div>
				<p className="text-xs font-bold text-brand-700">RAMU · RAPOR WALI</p>
				<b>{studentName || "Anak didik"}</b>
			</div>
			<div className="flex gap-2">
				<button
					onClick={onDownload}
					aria-label="Unduh PDF"
					className="rounded-lg p-2 text-brand-700"
				>
					<Download size={19} />
				</button>
				<button
					onClick={() => window.print()}
					aria-label="Cetak rapor"
					className="rounded-lg p-2 text-brand-700"
				>
					<Printer size={19} />
				</button>
			</div>
		</header>
	);
}
