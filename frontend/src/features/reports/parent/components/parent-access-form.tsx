import type { FormEvent } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";

type ParentAccessFormProps = {
	demo: boolean;
	error: string;
	loading: boolean;
	pin: string;
	onPinChange: (pin: string) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ParentAccessForm({
	demo,
	error,
	loading,
	pin,
	onPinChange,
	onSubmit,
}: ParentAccessFormProps) {
	return (
		<main className="ramu-surface-pattern grid min-h-screen place-items-center bg-[#f8f5ed] p-5 sm:p-8">
			<form
				onSubmit={onSubmit}
				className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-[#e3e7dc] bg-[#fffdf8] p-6 shadow-panel sm:p-8"
			>
				<p className="text-sm font-bold text-brand-700">RAMU · AKSES WALI</p>
				<h1 className="mt-1 text-xl font-bold">Raport murid</h1>
				<div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#f2f5ef] p-3.5 text-sm leading-6 text-[#526156]">
					<KeyRound className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
					<span>Masukkan PIN dari sekolah untuk membuka raport.</span>
				</div>
				{demo ? (
					<p className="mt-3 rounded-xl bg-brand-50 p-2 text-xs">
						Demo: PIN <b>123456</b>
					</p>
				) : null}
				<input
					required
					value={pin}
					onChange={(event) => onPinChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
					inputMode="numeric"
					className="mt-5 w-full rounded-xl border border-[#dfe3d9] bg-[#fffefa] p-3 text-center text-xl tracking-[0.3em] text-[#17251b] outline-none transition placeholder:tracking-normal placeholder:text-[#899188] focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
					placeholder="PIN enam digit"
				/>
				{error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
				<button
					disabled={loading}
					className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 font-semibold text-white shadow-[0_8px_18px_rgba(23,75,49,0.18)] transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{loading ? "Memeriksa…" : "Buka raport"}
				</button>
				<p className="mt-5 flex items-center justify-center gap-2 text-center text-xs leading-5 text-[#68746a]">
					<ShieldCheck size={15} className="shrink-0 text-brand-700" />
					Akses hanya untuk melihat, mengunduh, dan mencetak raport.
				</p>
			</form>
		</main>
	);
}
