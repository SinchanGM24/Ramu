"use client";

type SwitchProps = {
	name?: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	"aria-label": string;
};

export function Switch({ name, checked, onChange, "aria-label": ariaLabel }: SwitchProps) {
	return (
		<>
			<button
				type="button"
				role="switch"
				aria-checked={checked}
				aria-label={ariaLabel}
				onClick={() => onChange(!checked)}
				className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand-200 focus:ring-offset-2 ${
					checked ? "bg-brand-600" : "bg-slate-300"
				}`}
			>
				<span
					className={`size-5 rounded-full bg-white shadow-sm transition ${
						checked ? "translate-x-5" : "translate-x-0.5"
					}`}
				/>
			</button>
			{name ? <input type="hidden" name={name} value={checked ? "true" : "false"} /> : null}
		</>
	);
}
