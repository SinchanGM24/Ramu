import { Edit3 } from "lucide-react";
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
		<div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
			<table className="w-full min-w-[620px] text-left text-sm">
				<thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
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
						<tr key={account.id} className="border-t border-slate-100">
							<td className="px-4 py-3 font-semibold">
								<span className="block">{account.name}</span>
								<span className="font-normal text-slate-500">{account.email}</span>
							</td>
							<td className="px-4 py-3 text-slate-600">{account.phone || "Belum diisi"}</td>
							<td className="px-4 py-3">{roleName(account.role)}</td>
							<td className="px-4 py-3">{account.is_active ? "Aktif" : "Nonaktif"}</td>
							<td className="px-4 py-3 text-right">
								<Button variant="ghost" className="min-h-9 px-3" onClick={() => onEdit(account)}>
									<Edit3 size={15} />
									Edit
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
