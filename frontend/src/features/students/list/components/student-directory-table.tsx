import Link from "next/link";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PaginationControls } from "@/components/shared/pagination-controls";
import type { ClassGroup, StudentList } from "../types";

const inputClass =
	"w-full rounded-xl border border-[#dfe2d6] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50";

type StudentDirectoryTableProps = {
	classGroupId: string;
	classes: ClassGroup[];
	loading: boolean;
	page: number;
	pageSize: number;
	search: string;
	students?: StudentList;
	error: boolean;
	onClassGroupIdChange: (value: string) => void;
	onPageChange: (page: number) => void;
	onRetry: () => void;
	onSearchChange: (value: string) => void;
};

export function StudentDirectoryTable({
	classGroupId,
	classes,
	error,
	loading,
	page,
	pageSize,
	search,
	students,
	onClassGroupIdChange,
	onPageChange,
	onRetry,
	onSearchChange,
}: StudentDirectoryTableProps) {
	return (
		<Card>
			<div className="flex flex-col gap-4 border-b border-[#e7e7dc] pb-4 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<h2 className="font-bold tracking-[-0.02em] text-brand-950">Daftar murid</h2>
					<p className="mt-1 text-sm text-[#637065]">
						Gunakan pencarian atau filter kelas untuk mempersempit daftar.
					</p>
				</div>
				<p className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
					{students?.total ?? 0} murid
				</p>
			</div>
			<div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
				<label className="relative">
					<span className="sr-only">Cari murid</span>
					<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
					<input
						value={search}
						onChange={(event) => onSearchChange(event.target.value)}
						placeholder="Cari nama atau nomor induk"
						className={`${inputClass} pl-9`}
					/>
				</label>
				<label>
					<span className="sr-only">Filter kelas</span>
					<select
						value={classGroupId}
						onChange={(event) => onClassGroupIdChange(event.target.value)}
						className={inputClass}
					>
						<option value="">Semua kelas</option>
						{classes.map((item) => (
							<option key={item.id} value={item.id}>
								{item.name}
							</option>
						))}
					</select>
				</label>
			</div>
			<div className="mt-4 hidden md:block">
				<table className="w-full text-left text-sm">
					<thead className="border-b border-[#e7e7dc] text-xs font-semibold uppercase tracking-[0.12em] text-[#637065]">
						<tr>
							<th className="pb-3">Murid</th>
							<th className="pb-3">Kelas saat ini</th>
							<th className="pb-3 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<LoadingRows />
						) : error ? (
							<tr>
								<td colSpan={3} className="py-10 text-center text-red-700">
									Daftar murid tidak dapat dimuat.{" "}
									<button type="button" className="font-semibold underline" onClick={onRetry}>
										Coba lagi
									</button>
								</td>
							</tr>
						) : students?.items.length ? (
							students.items.map((student) => (
								<tr
									key={student.id}
									className="border-b border-[#e7e7dc] transition-colors hover:bg-brand-50/35 last:border-0"
								>
									<td className="py-4">
										<p className="font-semibold text-brand-950">{student.name}</p>
										<p className="mt-1 text-xs text-[#637065]">
											{student.student_number
												? `Nomor induk: ${student.student_number}`
												: "Nomor induk belum diisi"}
										</p>
									</td>
									<td className="py-4">
										<span className="inline-flex rounded-full bg-[#f1f3ec] px-2.5 py-1 text-xs font-medium text-[#4e5c50]">
											{student.class_name || "Belum ditempatkan"}
										</span>
									</td>
									<td className="py-4 text-right">
										<Link
											href={`/app/academic/students/${student.id}`}
											className="font-semibold text-brand-700 hover:text-brand-800"
										>
											Kelola
										</Link>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={3} className="py-12 text-center">
									<p className="font-semibold text-slate-700">Tidak ada murid yang ditemukan</p>
									<p className="mt-1 text-sm text-slate-500">
										Ubah pencarian atau filter kelas, atau tambahkan murid baru.
									</p>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
			<div className="mt-4 space-y-3 md:hidden">
				{loading ? (
					<MobileLoadingCards />
				) : error ? (
					<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
						Daftar murid tidak dapat dimuat.{" "}
						<button type="button" className="font-semibold underline" onClick={onRetry}>
							Coba lagi
						</button>
					</div>
				) : students?.items.length ? (
					students.items.map((student) => (
						<article key={student.id} className="rounded-2xl border border-[#e7e7dc] bg-white p-4">
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<h3 className="font-semibold text-brand-950">{student.name}</h3>
									<p className="mt-1 text-xs text-[#637065]">
										{student.student_number
											? `Nomor induk: ${student.student_number}`
											: "Nomor induk belum diisi"}
									</p>
								</div>
								<Link
									href={`/app/academic/students/${student.id}`}
									className="text-sm font-semibold text-brand-700"
								>
									Kelola
								</Link>
							</div>
							<span className="mt-3 inline-flex rounded-full bg-[#f1f3ec] px-2.5 py-1 text-xs font-medium text-[#4e5c50]">
								{student.class_name || "Belum ditempatkan"}
							</span>
						</article>
					))
				) : (
					<div className="rounded-2xl border border-dashed border-[#dfe3d8] px-4 py-10 text-center">
						<p className="font-semibold text-slate-700">Tidak ada murid yang ditemukan</p>
						<p className="mt-1 text-sm text-slate-500">
							Ubah pencarian atau filter kelas, atau tambahkan murid baru.
						</p>
					</div>
				)}
			</div>
			<PaginationControls
				page={page}
				pageSize={pageSize}
				total={students?.total ?? 0}
				onPageChange={onPageChange}
			/>
		</Card>
	);
}

function MobileLoadingCards() {
	return (
		<>
			{Array.from({ length: 3 }, (_, index) => (
				<div key={index} className="rounded-2xl border border-[#e7e7dc] bg-white p-4">
					<div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
					<div className="mt-2 h-3 w-28 animate-pulse rounded bg-slate-100" />
					<div className="mt-3 h-6 w-24 animate-pulse rounded-full bg-slate-100" />
				</div>
			))}
		</>
	);
}

function LoadingRows() {
	return (
		<>
			{Array.from({ length: 4 }, (_, index) => (
				<tr key={index} className="border-b border-slate-100">
					<td className="py-4">
						<div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
						<div className="mt-2 h-3 w-28 animate-pulse rounded bg-slate-100" />
					</td>
					<td>
						<div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
					</td>
					<td />
				</tr>
			))}
		</>
	);
}
