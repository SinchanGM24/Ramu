"use client";

type Scale = { id: string; code: string; label: string };
type Indicator = { id: string; description: string; scaleOptionId?: string | null };

export function ReportAssessmentTable({
  subArea,
  scales,
  editable,
  savingIndicatorId,
  pendingScaleOptionIds,
  onChoose,
}: {
  subArea: { id: string; name: string; indicators: Indicator[] };
  scales: Scale[];
  editable: boolean;
  savingIndicatorId?: string;
  pendingScaleOptionIds?: Record<string, string>;
  onChoose: (indicatorId: string, scaleOptionId: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[680px] w-full border-collapse text-left text-sm">
        <thead>
          <tr className="bg-slate-200 text-slate-900">
            <th rowSpan={2} className="w-14 border border-slate-500 px-2 py-2 text-center">No</th>
            <th rowSpan={2} className="border border-slate-500 px-3 py-2">Aspek perkembangan</th>
            <th colSpan={scales.length} className="border border-slate-500 px-3 py-2 text-center">Hasil penilaian</th>
          </tr>
          <tr className="bg-slate-100 text-xs">
            {scales.map((scale) => <th key={scale.id} scope="col" className="w-20 border border-slate-500 px-2 py-2 text-center">{scale.code}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr className="bg-slate-50">
            <th colSpan={2 + scales.length} scope="rowgroup" className="border border-slate-400 px-3 py-2 font-semibold text-slate-800">{subArea.name}</th>
          </tr>
          {subArea.indicators.map((indicator, index) => {
            const isSaving = savingIndicatorId === indicator.id;
            return <tr key={indicator.id} className="align-middle">
              <td className="border border-slate-400 px-2 py-2 text-center text-slate-600">{index + 1}</td>
              <td className="border border-slate-400 px-3 py-2 font-medium text-slate-800">{indicator.description}{isSaving && <span className="ml-2 text-xs font-normal text-brand-700">Menyimpan…</span>}</td>
              {scales.map((scale) => {
                const inputId = `indicator-${indicator.id}-${scale.id}`;
                return <td key={scale.id} className="border border-slate-400 p-1 text-center">
                  <label htmlFor={inputId} className={`inline-grid size-10 place-items-center rounded-full transition ${editable ? "cursor-pointer hover:bg-brand-50" : "cursor-not-allowed"}`}>
                    <input id={inputId} name={`indicator-${indicator.id}`} type="radio" value={scale.id} checked={(pendingScaleOptionIds?.[indicator.id] ?? indicator.scaleOptionId) === scale.id} disabled={!editable || isSaving} onChange={() => onChoose(indicator.id, scale.id)} aria-label={`${indicator.description}: ${scale.code} (${scale.label})`} className="size-4 accent-brand-600" />
                    <span className="sr-only">{scale.label}</span>
                  </label>
                </td>;
              })}
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}
