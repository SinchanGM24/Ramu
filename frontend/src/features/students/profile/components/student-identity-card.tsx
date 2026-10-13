import { CalendarDays, Hash, MapPin, UserRound } from "lucide-react";
import type { StudentProfile } from "../types";

export function StudentIdentityCard({ student }: { student: StudentProfile }) {
	const gender =
		student.gender === "MALE"
			? "Laki-laki"
			: student.gender === "FEMALE"
				? "Perempuan"
				: "Belum diisi";
	const birth =
		[
			student.birth_place,
			student.birth_date
				? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
						new Date(student.birth_date),
					)
				: null,
		]
			.filter(Boolean)
			.join(", ") || "Data kelahiran belum diisi";

	return (
		<section className="relative mb-6 overflow-hidden rounded-[2rem] border border-white/80 bg-[#fffdf8] p-5 shadow-soft sm:p-6">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -right-8 -top-12 size-40 rounded-full border-[14px] border-brand-100/80"
			/>
			<div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
				<span className="grid size-16 place-items-center rounded-3xl bg-brand-50 text-brand-700 shadow-sm">
					<UserRound size={29} />
				</span>
				<div className="min-w-0 flex-1">
					<p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
						Identitas murid
					</p>
					<h2 className="mt-1 truncate text-2xl font-bold tracking-[-0.04em] text-brand-950">
						{student.name}
					</h2>
					<p className="mt-1 text-sm text-[#637065]">
						{student.nickname ? `Panggilan: ${student.nickname}` : "Nama panggilan belum diisi"}
					</p>
				</div>
				<div className="grid gap-3 text-sm text-[#4e5c50] sm:grid-cols-3">
					<IdentityItem
						icon={Hash}
						label="Nomor induk"
						value={student.student_number || "Belum diisi"}
					/>
					<IdentityItem icon={CalendarDays} label="Kelahiran" value={birth} />
					<IdentityItem icon={MapPin} label="Jenis kelamin" value={gender} />
				</div>
			</div>
		</section>
	);
}

function IdentityItem({
	icon: Icon,
	label,
	value,
}: {
	icon: typeof Hash;
	label: string;
	value: string;
}) {
	return (
		<div className="min-w-0">
			<p className="flex items-center gap-1.5 text-xs font-semibold text-[#637065]">
				<Icon size={14} className="text-brand-700" />
				{label}
			</p>
			<p className="mt-1 max-w-40 truncate font-medium text-brand-950">{value}</p>
		</div>
	);
}
