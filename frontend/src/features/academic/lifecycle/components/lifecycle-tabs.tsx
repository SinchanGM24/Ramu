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
		<div className="mb-5 inline-flex rounded-2xl border border-[#dfe2d6] bg-[#eef0e9] p-1">
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
			className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${active ? "bg-[#fffdf8] text-brand-700 shadow-sm" : "text-[#637065] hover:bg-white/70 hover:text-brand-800"}`}
		>
			{children}
		</button>
	);
}
