import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ParentAccessCardProps = { link: string; pin: string };

export function ParentAccessCard({ link, pin }: ParentAccessCardProps) {
	return (
		<Card className="mb-4 border-brand-200 bg-brand-50">
			<h2 className="font-bold text-slate-900">Akses wali siap dibagikan</h2>
			<p className="mt-1 text-sm text-slate-600">
				Simpan PIN ini sekarang. Demi keamanan, PIN tidak akan ditampilkan kembali dari halaman ini.
			</p>
			<dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
				<div>
					<dt className="font-medium text-slate-600">Tautan rapor</dt>
					<dd className="mt-1 break-all rounded-lg bg-white p-3 font-semibold text-brand-700">
						{link}
					</dd>
				</div>
				<div>
					<dt className="font-medium text-slate-600">PIN wali</dt>
					<dd className="mt-1 rounded-lg bg-white p-3 text-xl font-bold tracking-[0.35em] text-slate-900">
						{pin}
					</dd>
				</div>
			</dl>
			<Button
				className="mt-4"
				variant="secondary"
				onClick={() =>
					navigator.clipboard?.writeText(`${window.location.origin}${link}\nPIN: ${pin}`)
				}
			>
				Salin tautan dan PIN
			</Button>
		</Card>
	);
}
