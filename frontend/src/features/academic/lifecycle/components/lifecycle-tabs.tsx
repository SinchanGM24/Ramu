import type { ReactNode } from "react";
import type { LifecycleMode } from "../types";

export function LifecycleTabs({
	mode,
	onChange,
}: {
	mode: LifecycleMode;
	onChange: (mode: LifecycleMode) => void;
}) {
	return (
		<div className="mb-5 flex gap-2 border-b border-slate-200">
			<Tab active={mode === "transfer"} onClick={() => onChange("transfer")}>
				Perpindahan Kelas
			</Tab>
			<Tab active={mode === "graduation"} onClick={() => onChange("graduation")}>
				Kelulusan
			</Tab>
		</div>
	);
}
function Tab({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-white text-brand-700 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:bg-white/70 hover:text-slate-800"}`}
		>
			{children}
		</button>
	);
}
