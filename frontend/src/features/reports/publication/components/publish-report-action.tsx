import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Completeness = {
	complete: boolean;
	missingAssessments: string[];
	missingNarratives: string[];
	missingSemesterData: boolean;
};

type PublishReportActionProps = {
	pending: boolean;
	reportId: string;
	onPublish: () => void;
};

export function PublishReportAction({ pending, reportId, onPublish }: PublishReportActionProps) {
	const completeness = useQuery({
		queryKey: ["report-completeness", reportId],
		queryFn: () => api<Completeness>(`/reports/${reportId}/completeness`),
	});

	if (completeness.isLoading) {
		return <span className="text-sm text-slate-500">Memeriksa kelengkapan…</span>;
	}
	if (completeness.isError || !completeness.data) {
		return <span className="text-sm text-red-700">Kelengkapan raport belum dapat diperiksa.</span>;
	}

	const data = completeness.data;
	const missing = [
		data.missingAssessments.length ? `${data.missingAssessments.length} penilaian indikator` : "",
		data.missingNarratives.length ? `${data.missingNarratives.length} narasi perkembangan` : "",
		data.missingSemesterData ? "data akhir semester" : "",
	].filter(Boolean);

	return (
		<div className="flex flex-col items-end gap-2">
			<Button disabled={!data.complete || pending} onClick={onPublish}>
				Terbitkan raport
			</Button>
			{!data.complete ? (
				<p className="flex max-w-sm items-start gap-1.5 text-left text-xs text-amber-800">
					<AlertCircle className="mt-0.5 size-3.5 shrink-0" />
					Belum dapat diterbitkan: {missing.join(", ")} belum lengkap.
				</p>
			) : null}
		</div>
	);
}
