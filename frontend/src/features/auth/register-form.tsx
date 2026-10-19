import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthShell } from "./auth-shell";

export function RegisterForm() {
	return (
		<AuthShell
			title="Pendaftaran belum dibuka"
			description="Akun sekolah RAMU saat ini dibuat oleh pengelola platform. Hubungi pengelola jika sekolah Anda membutuhkan akses."
			footer={
				<Link className="font-semibold text-brand-700" href="/login">
					Kembali ke halaman masuk
				</Link>
			}
		>
			<Button className="w-full" disabled>
				Pendaftaran sekolah belum tersedia
			</Button>
		</AuthShell>
	);
}
