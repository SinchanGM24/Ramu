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
		<>
			<div className="mt-5 hidden overflow-hidden rounded-xl border border-[#e5e7dc] bg-[#fffefa] md:block">
				<table className="w-full table-fixed text-left text-sm">
					<colgroup>
						<col className="w-[30%]" />
						<col className="w-[23%]" />
						<col className="w-[16%]" />
						<col className="w-[15%]" />
						<col className="w-[9rem]" />
					</colgroup>
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
									<span className="block truncate" title={account.name}>
										{account.name}
									</span>
									<span
										className="mt-0.5 block truncate font-normal text-[#6c776e]"
										title={account.email}
									>
										{account.email}
									</span>
								</td>
								<td
									className="truncate px-4 py-3.5 text-[#566258]"
									title={account.phone || undefined}
								>
									{account.phone || "Belum diisi"}
								</td>
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
			<div className="mt-5 space-y-3 md:hidden">
				{accounts?.map((account) => (
					<article
						key={account.id}
						className="rounded-2xl border border-[#e5e7dc] bg-[#fffefa] p-4"
					>
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<h3 className="truncate font-semibold text-[#17251b]">{account.name}</h3>
								<p className="mt-1 truncate text-xs text-[#6c776e]">{account.email}</p>
							</div>
							<span
								className={
									account.is_active
										? "rounded-lg bg-[#e7f3e9] px-2.5 py-1 text-xs font-semibold text-[#277342]"
										: "rounded-lg bg-[#f1f1ed] px-2.5 py-1 text-xs font-semibold text-[#667168]"
								}
							>
								{account.is_active ? "Aktif" : "Nonaktif"}
							</span>
						</div>
						<div className="mt-3 flex items-center justify-between border-t border-[#edf0e8] pt-3">
							<div className="text-xs text-[#566258]">
								<p>{roleName(account.role)}</p>
								<p className="mt-1">{account.phone || "Nomor telepon belum diisi"}</p>
							</div>
							<Button variant="ghost" className="min-h-9 px-3" onClick={() => onEdit(account)}>
								<Edit3 size={15} />
								Edit
							</Button>
						</div>
					</article>
				))}
				{accounts?.length === 0 ? (
					<div className="rounded-2xl border border-[#e5e7dc] bg-[#fffefa] px-4 py-10 text-center">
						<UsersRound className="mx-auto size-7 text-[#9aa39a]" aria-hidden="true" />
						<p className="mt-3 font-semibold text-[#35443a]">Akun tidak ditemukan</p>
						<p className="mt-1 text-sm text-[#6c776e]">
							Ubah kata kunci pencarian atau tambah akun baru.
						</p>
					</div>
				) : null}
			</div>
		</>
	);
}
