import type { FormEvent } from "react";

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
		<main className="grid min-h-screen place-items-center bg-brand-50 p-5">
			<form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
				<p className="text-sm font-bold text-brand-700">RAMU · AKSES WALI</p>
				<h1 className="mt-1 text-xl font-bold">Rapor murid</h1>
				<p className="mt-2 text-sm text-slate-600">
					Masukkan PIN dari sekolah untuk membuka rapor.
				</p>
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
					className="mt-5 w-full rounded-xl border p-3 text-center text-xl"
					placeholder="PIN enam digit"
				/>
				{error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
				<button
					disabled={loading}
					className="mt-4 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white"
				>
					{loading ? "Memeriksa…" : "Buka rapor"}
				</button>
			</form>
		</main>
	);
}
