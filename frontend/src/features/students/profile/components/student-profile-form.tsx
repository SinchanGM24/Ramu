import type { FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { StudentProfile } from "../types";

const inputClass =
	"mt-1 w-full rounded-xl border border-[#dfe2d6] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50";

type StudentProfileFormProps = {
	pending: boolean;
	student: StudentProfile;
	onSubmit: (body: unknown) => void;
};

export function StudentProfileForm({ pending, student, onSubmit }: StudentProfileFormProps) {
	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		onSubmit({
			name: form.get("name"),
			nickname: form.get("nickname") || null,
			studentNumber: form.get("studentNumber") || null,
			birthPlace: form.get("birthPlace") || null,
			birthDate: form.get("birthDate") || null,
			gender: form.get("gender") || null,
			religion: form.get("religion") || null,
			childOrder: form.get("childOrder") ? Number(form.get("childOrder")) : null,
			address: form.get("address") || null,
		});
	}

	return (
		<Card>
			<h2 className="text-lg font-bold tracking-[-0.02em] text-brand-950">Keterangan anak didik</h2>
			<p className="mt-1 text-sm leading-6 text-[#637065]">
				Kelas dikelola melalui penempatan kelas agar riwayat raport tetap aman.
			</p>
			<form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2">
				<Field label="Nama anak didik">
					<input required name="name" defaultValue={student.name} className={inputClass} />
				</Field>
				<Field label="Nama panggilan">
					<input name="nickname" defaultValue={student.nickname ?? ""} className={inputClass} />
				</Field>
				<Field label="Nomor induk">
					<input
						name="studentNumber"
						defaultValue={student.student_number ?? ""}
						className={inputClass}
					/>
				</Field>
				<Field label="Tempat lahir">
					<input
						name="birthPlace"
						defaultValue={student.birth_place ?? ""}
						className={inputClass}
					/>
				</Field>
				<Field label="Tanggal lahir">
					<input
						name="birthDate"
						type="date"
						defaultValue={student.birth_date?.slice(0, 10) ?? ""}
						className={inputClass}
					/>
				</Field>
				<Field label="Jenis kelamin">
					<select name="gender" defaultValue={student.gender ?? ""} className={inputClass}>
						<option value="">Belum diisi</option>
						<option value="MALE">Laki-laki</option>
						<option value="FEMALE">Perempuan</option>
					</select>
				</Field>
				<Field label="Agama">
					<input name="religion" defaultValue={student.religion ?? ""} className={inputClass} />
				</Field>
				<Field label="Anak ke">
					<input
						name="childOrder"
						type="number"
						min="1"
						defaultValue={student.child_order ?? ""}
						className={inputClass}
					/>
				</Field>
				<Field label="Alamat" wide>
					<textarea
						name="address"
						defaultValue={student.address ?? ""}
						className={`${inputClass} min-h-24`}
					/>
				</Field>
				<div className="md:col-span-2">
					<Button disabled={pending}>{pending ? "Menyimpan…" : "Simpan profil murid"}</Button>
				</div>
			</form>
		</Card>
	);
}

function Field({
	label,
	children,
	wide = false,
}: {
	label: string;
	children: ReactNode;
	wide?: boolean;
}) {
	return (
		<label className={`block text-sm font-medium text-[#314137] ${wide ? "md:col-span-2" : ""}`}>
			<span>{label}</span>
			{children}
		</label>
	);
}
