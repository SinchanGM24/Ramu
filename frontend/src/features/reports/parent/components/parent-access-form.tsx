import type { FormEvent } from "react";
import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { demoParentProfiles } from "@/lib/demo-parent-reports";

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
				{demo ? <DemoAccessExamples /> : null}
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

function DemoAccessExamples() {
	return (
		<section className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-3.5">
			<p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-800">
				Contoh akses wali
			</p>
			<p className="mt-1 text-xs leading-5 text-[#526156]">
				Pilih contoh raport, lalu masukkan PIN masing-masing untuk mencoba akses wali.
			</p>
			<div className="mt-3 grid gap-2">
				{demoParentProfiles.map((profile) => (
					<Link
						key={profile.token}
						href={`/r/${profile.token}`}
						className="flex items-center justify-between gap-3 rounded-xl border border-white/90 bg-white px-3 py-2.5 text-left shadow-[0_3px_8px_rgba(41,93,65,0.06)] transition hover:border-brand-200 hover:bg-brand-50"
					>
						<span>
							<span className="block text-sm font-semibold text-[#17251b]">
								{profile.student.name}
							</span>
							<span className="mt-0.5 block text-xs text-[#68746a]">
								{profile.student.class_name} Â· {profile.semester.name}
							</span>
						</span>
						<span className="shrink-0 rounded-lg bg-brand-700 px-2 py-1 font-mono text-xs font-bold tracking-wide text-white">
							{profile.pin}
						</span>
					</Link>
				))}
			</div>
		</section>
	);
}
