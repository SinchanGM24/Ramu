import { Edit3, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StaffMember } from "../types";

const roleName = (role: StaffMember["role"]) =>
	role === "TEACHER" ? "Guru" : role === "PRINCIPAL" ? "Kepala sekolah" : "Admin sekolah";
export function StaffDirectoryTable({
	accounts,
	onEdit,
}: {
	accounts?: StaffMember[];
	onEdit: (staff: StaffMember) => void;
}) {
	return (
		<div className="mt-5 overflow-x-auto rounded-xl border border-[#e5e7dc] bg-[#fffefa]">
			<table className="w-full min-w-[620px] text-left text-sm">
				<thead className="bg-[#f3f5ef] text-xs font-bold uppercase tracking-[0.08em] text-[#667168]">
					<tr>
						<th className="px-4 py-3">Nama</th>
						<th className="px-4 py-3">Nomor telepon</th>
						<th className="px-4 py-3">Peran</th>
						<th className="px-4 py-3">Status</th>
						<th className="px-4 py-3 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{accounts?.map((account) => (
						<tr
							key={account.id}
							className="border-t border-[#edf0e8] transition-colors hover:bg-[#f8faf5]"
						>
							<td className="px-4 py-3.5 font-semibold text-[#17251b]">
								<span className="block">{account.name}</span>
								<span className="mt-0.5 block font-normal text-[#6c776e]">{account.email}</span>
							</td>
							<td className="px-4 py-3.5 text-[#566258]">{account.phone || "Belum diisi"}</td>
							<td className="px-4 py-3.5 text-[#35443a]">{roleName(account.role)}</td>
							<td className="px-4 py-3.5">
								<span
									className={
										account.is_active
											? "rounded-lg bg-[#e7f3e9] px-2.5 py-1 text-xs font-semibold text-[#277342]"
											: "rounded-lg bg-[#f1f1ed] px-2.5 py-1 text-xs font-semibold text-[#667168]"
									}
								>
									{account.is_active ? "Aktif" : "Nonaktif"}
								</span>
							</td>
							<td className="px-4 py-3.5 text-right">
								<Button variant="ghost" className="min-h-9 px-3" onClick={() => onEdit(account)}>
									<Edit3 size={15} />
									Edit
								</Button>
							</td>
						</tr>
					))}
					{accounts?.length === 0 ? (
						<tr>
							<td colSpan={5} className="px-4 py-12 text-center">
								<UsersRound className="mx-auto size-7 text-[#9aa39a]" aria-hidden="true" />
								<p className="mt-3 font-semibold text-[#35443a]">Akun tidak ditemukan</p>
								<p className="mt-1 text-sm text-[#6c776e]">
									Ubah kata kunci pencarian atau tambah akun baru.
								</p>
							</td>
						</tr>
					) : null}
				</tbody>
			</table>
		</div>
	);
}
