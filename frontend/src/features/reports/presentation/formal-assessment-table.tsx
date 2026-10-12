import { scales } from "./report-scale-legend";
import type { FormalAssessmentItem } from "./types";

export function FormalAssessmentTable({ items }: { items: FormalAssessmentItem[] }) {
	return (
		<div className="overflow-x-auto">
			<table className="min-w-full border-collapse text-left text-xs">
				<thead>
					<tr className="bg-slate-200">
						<th className="border border-slate-500 p-2">No</th>
						<th className="border border-slate-500 p-2">Aspek perkembangan</th>
						{scales.map((scale) => (
							<th key={scale} className="border border-slate-500 p-2 text-center">
								{scale}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{items.map((item, index) => (
						<tr key={`${item.description}-${index}`}>
							<td className="border border-slate-400 p-2 text-center">{index + 1}</td>
							<td className="border border-slate-400 p-2">
								<small className="block text-slate-500">{item.sub_area_name || "Indikator"}</small>
								{item.description}
							</td>
							{scales.map((scale) => (
								<td key={scale} className="border border-slate-400 p-2 text-center text-base">
									{(item.scale_code || item.code) === scale ? "✓" : ""}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
