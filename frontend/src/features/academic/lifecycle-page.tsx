"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

type Student = {
	id: string;
	name: string;
	student_number?: string | null;
	class_name?: string | null;
	lifecycle_status: "ACTIVE" | "GRADUATED";
};
type ClassGroup = { id: string; name: string };
type Mode = "transfer" | "graduation";
type Proposal = { id: string; operation_type: "TRANSFER" | "GRADUATION"; reason?: string | null; payload: { items?: { studentId: string }[]; studentIds?: string[] }; created_at: string; requester_name: string };
const today = () => new Date().toISOString().slice(0, 10);

export function LifecyclePage() {
	const qc = useQueryClient();
	const [mode, setMode] = useState<Mode>("transfer");
	const [chosen, setChosen] = useState<string[]>([]);
	const [classFilter, setClassFilter] = useState("");
	const [search, setSearch] = useState("");
	const [panel, setPanel] = useState(false);
	const [notice, setNotice] = useState("");
	const [error, setError] = useState("");
	const session = useQuery({ queryKey: ["session"], queryFn: () => api<{ role: "SCHOOL_ADMIN" | "TEACHER" | "PRINCIPAL" }>("/auth/session") });
	const isTeacher = session.data?.role === "TEACHER";
	const isPrincipal = session.data?.role === "PRINCIPAL";
	const proposals = useQuery({ queryKey: ["lifecycle", "proposals"], enabled: isPrincipal, queryFn: () => api<Proposal[]>("/lifecycle/proposals") });
	const decide = useMutation({ mutationFn: ({ id, decision, note }: { id: string; decision: "APPROVED" | "REJECTED"; note?: string }) => api(`/lifecycle/proposals/${id}/decision`, { method: "POST", body: JSON.stringify({ decision, note }) }), onSuccess: () => { setNotice("Pengajuan telah diproses."); qc.invalidateQueries({ queryKey: ["lifecycle", "proposals"] }); qc.invalidateQueries({ queryKey: ["students"] }); } });
	const students = useQuery({
		queryKey: ["students"],
		queryFn: () => api<{ items: Student[] }>("/students?limit=100"),
	});
	const active = useMemo(
		() =>
			students.data?.items.filter(
				(x) =>
					x.lifecycle_status === "ACTIVE" &&
					(!classFilter || x.class_name === classFilter) &&
					x.name.toLowerCase().includes(search.toLowerCase()),
			) ?? [],
		[students.data, classFilter, search],
	);
	const selected = active.filter((x) => chosen.includes(x.id));
	const allFiltered =
		active.length > 0 && active.every((x) => chosen.includes(x.id));
	const classes = [
		...new Set(
			(students.data?.items ?? []).map((x) => x.class_name).filter(Boolean),
		),
	] as string[];
	function switchMode(next: Mode) {
		setMode(next);
		setChosen([]);
		setPanel(false);
		setError("");
	}
	function toggle(id: string) {
		setChosen((value) =>
			value.includes(id) ? value.filter((item) => item !== id) : [...value, id],
		);
	}
	function toggleAll() {
		setChosen(allFiltered ? [] : active.map((x) => x.id));
	}
	async function completed(message: string) {
		setPanel(false);
		setChosen([]);
		setNotice(message);
		await qc.invalidateQueries({ queryKey: ["students"] });
	}
	if (isPrincipal) return <PrincipalProposalQueue proposals={proposals.data ?? []} loading={proposals.isLoading} pending={decide.isPending} onDecide={(id, decision, note) => decide.mutate({ id, decision, note })} />;
	return (
		<>
			<PageHeader
				eyebrow="Manajemen siswa"
				title="Perpindahan & Kelulusan"
				description={isTeacher ? "Ajukan perpindahan atau kelulusan murid kelas Anda untuk disetujui Kepala Sekolah." : "Pilih murid terlebih dahulu, lalu tinjau tindakan administratif secara terpisah."}
				action={
					<Link href="/app/academic/archive">
						<Button variant="secondary">Lihat Arsip</Button>
					</Link>
				}
			/>
			{error && (
				<p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
					{error}
				</p>
			)}
			{notice && (
				<p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
					{notice}
				</p>
			)}
			<div className="mb-5 flex gap-2 border-b border-slate-200">
				<Tab
					active={mode === "transfer"}
					onClick={() => switchMode("transfer")}
				>
					Perpindahan Kelas
				</Tab>
				<Tab
					active={mode === "graduation"}
					onClick={() => switchMode("graduation")}
				>
					Kelulusan
				</Tab>
			</div>
			<Card>
				<div className="grid gap-3 md:grid-cols-2">
					<select
						value={classFilter}
						onChange={(e) => setClassFilter(e.target.value)}
						className="rounded-xl border p-3 text-sm"
						aria-label="Filter kelas"
					>
						<option value="">Semua kelas</option>
						{classes.map((x) => (
							<option key={x}>{x}</option>
						))}
					</select>
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Cari nama murid"
						className="rounded-xl border p-3 text-sm"
					/>
				</div>
			</Card>
			<StudentSelectionTable
				students={active}
				selectedIds={chosen}
				allSelected={allFiltered}
				mode={mode}
				onToggle={toggle}
				onToggleAll={toggleAll}
			/>
			{selected.length > 0 && (
				<div className="sticky bottom-4 z-20 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-lg">
					<p className="text-sm font-medium">{selected.length} murid dipilih</p>
					<div className="flex gap-2">
						<Button variant="ghost" onClick={() => setChosen([])}>
							Batalkan pilihan
						</Button>
						<Button
							onClick={() => {
								setError("");
								setPanel(true);
							}}
						>
							{mode === "transfer" ? "Atur perpindahan" : "Tinjau kelulusan"}
						</Button>
					</div>
				</div>
			)}
			{panel &&
				(mode === "transfer" ? (
					<TransferPanel
						students={selected}
						onClose={() => setPanel(false)}
						onSuccess={completed}
						onError={setError}
						isTeacher={isTeacher}
					/>
				) : (
					<GraduationPanel
						students={selected}
						onClose={() => setPanel(false)}
						onSuccess={completed}
						onError={setError}
						isTeacher={isTeacher}
					/>
				))}
		</>
	);
}

function PrincipalProposalQueue({ proposals, loading, pending, onDecide }: { proposals: Proposal[]; loading: boolean; pending: boolean; onDecide: (id: string, decision: "APPROVED" | "REJECTED", note?: string) => void }) {
	const [notes, setNotes] = useState<Record<string, string>>({});
	return <><PageHeader eyebrow="Persetujuan" title="Pengajuan perpindahan & kelulusan" description="Tinjau pengajuan guru sebelum perubahan administratif diterapkan." action={<Link href="/app/academic/archive"><Button variant="secondary">Lihat Arsip</Button></Link>} />{loading ? <Card>Memuat pengajuan…</Card> : proposals.length ? <div className="space-y-4">{proposals.map((proposal) => { const count = proposal.payload.items?.length ?? proposal.payload.studentIds?.length ?? 0; return <Card key={proposal.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">{proposal.operation_type === "TRANSFER" ? "Perpindahan kelas" : "Kelulusan"}</h2><p className="mt-1 text-sm text-slate-500">Diajukan oleh {proposal.requester_name} · {count} murid</p>{proposal.reason && <p className="mt-3 text-sm text-slate-700">Catatan guru: {proposal.reason}</p>}</div><div className="flex gap-2"><Button disabled={pending} onClick={() => onDecide(proposal.id, "APPROVED")}>Setujui</Button><Button variant="danger" disabled={pending || !notes[proposal.id]?.trim()} onClick={() => onDecide(proposal.id, "REJECTED", notes[proposal.id])}>Tolak</Button></div></div><label className="mt-4 block text-sm font-medium">Catatan keputusan <span className="font-normal text-slate-500">(wajib bila ditolak)</span><textarea value={notes[proposal.id] ?? ""} onChange={(event) => setNotes(value => ({ ...value, [proposal.id]: event.target.value }))} className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Tambahkan catatan bila diperlukan" /></label></Card>; })}</div> : <Card className="py-10 text-center"><h2 className="font-bold">Tidak ada pengajuan menunggu</h2><p className="mt-1 text-sm text-slate-500">Pengajuan guru yang baru akan tampil di sini.</p></Card>}</>;
}

function Tab({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-white text-brand-700 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:bg-white/70 hover:text-slate-800"}`}
		>
			{children}
		</button>
	);
}

function StudentSelectionTable({
	students,
	selectedIds,
	allSelected,
	mode,
	onToggle,
	onToggleAll,
}: {
	students: Student[];
	selectedIds: string[];
	allSelected: boolean;
	mode: Mode;
	onToggle: (id: string) => void;
	onToggleAll: () => void;
}) {
	const action = mode === "transfer" ? "dipindahkan kelas" : "dinyatakan lulus";
	return (
		<Card className="mt-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="font-bold">Murid aktif</h2>
					<p className="mt-1 text-sm text-slate-500">
						Pilih murid yang akan {action}.
					</p>
				</div>
				<span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
					{students.length} murid
				</span>
			</div>
			{students.length ? (
				<>
					<div className="mt-5 hidden overflow-hidden rounded-xl border border-slate-200 md:block">
						<table className="w-full text-left text-sm">
							<thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
								<tr>
									<th className="w-14 px-4 py-3">
										<input
											type="checkbox"
											checked={allSelected}
											onChange={onToggleAll}
											aria-label="Pilih semua hasil filter"
										/>
									</th>
									<th className="px-4 py-3">Murid</th>
									<th className="px-4 py-3">Kelas saat ini</th>
									<th className="px-4 py-3 text-right">Pilihan</th>
								</tr>
							</thead>
							<tbody>
								{students.map((student) => {
									const selected = selectedIds.includes(student.id);
									return (
										<tr
											key={student.id}
											role="checkbox"
											aria-checked={selected}
											tabIndex={0}
											onClick={() => onToggle(student.id)}
											onKeyDown={(event) => {
												if (event.key === "Enter" || event.key === " ") {
													event.preventDefault();
													onToggle(student.id);
												}
											}}
											className={`cursor-pointer border-t border-slate-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-600 ${selected ? "bg-brand-50/70" : "hover:bg-slate-50/70"}`}
										>
											<td className="px-4 py-4">
												<input
													type="checkbox"
													checked={selected}
													onClick={(event) => event.stopPropagation()}
													onChange={() => onToggle(student.id)}
													aria-label={`Pilih ${student.name}`}
												/>
											</td>
											<td className="px-4 py-4">
												<p className="font-semibold text-slate-900">
													{student.name}
												</p>
												<p className="mt-1 text-xs text-slate-500">
													{student.student_number
														? `Nomor induk: ${student.student_number}`
														: "Nomor induk belum diisi"}
												</p>
											</td>
											<td className="px-4 py-4">
												<span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
													{student.class_name || "Belum ditempatkan"}
												</span>
											</td>
											<td className="px-4 py-4 text-right text-xs font-medium">
												<span
													className={
														selected ? "text-brand-700" : "text-slate-400"
													}
												>
													{selected ? "Dipilih" : "Belum dipilih"}
												</span>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
					<div className="mt-4 space-y-2 md:hidden">
						{students.map((student) => {
							const selected = selectedIds.includes(student.id);
							return (
								<label
									key={student.id}
									className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${selected ? "border-brand-200 bg-brand-50/70" : "border-slate-200 bg-white"}`}
								>
									<input
										type="checkbox"
										checked={selected}
										onChange={() => onToggle(student.id)}
										className="mt-1"
										aria-label={`Pilih ${student.name}`}
									/>
									<span className="min-w-0 flex-1">
										<span className="block truncate font-semibold text-slate-900">
											{student.name}
										</span>
										<span className="mt-1 block text-xs text-slate-500">
											{student.student_number
												? `Nomor induk: ${student.student_number}`
												: "Nomor induk belum diisi"}
										</span>
										<span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
											{student.class_name || "Belum ditempatkan"}
										</span>
									</span>
									<span
										className={`pt-1 text-xs font-medium ${selected ? "text-brand-700" : "text-slate-400"}`}
									>
										{selected ? "Dipilih" : ""}
									</span>
								</label>
							);
						})}
					</div>
				</>
			) : (
				<p className="py-10 text-center text-sm text-slate-500">
					Tidak ada murid sesuai filter.
				</p>
			)}
		</Card>
	);
}

function ActionPanel({
	title,
	children,
	onClose,
}: {
	title: string;
	children: React.ReactNode;
	onClose: () => void;
}) {
	useEffect(() => {
		const close = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", close);
		return () => window.removeEventListener("keydown", close);
	}, [onClose]);
	return (
		<div
			className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-[2px]"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby="action-panel-title"
				className="mx-auto my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
			>
				<div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
							Tindakan administratif
						</p>
						<h2
							id="action-panel-title"
							className="mt-1 text-xl font-bold text-slate-950"
						>
							{title}
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Tutup panel"
						className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
					>
						<X size={20} />
					</button>
				</div>
				<div className="p-5 sm:p-6">{children}</div>
			</section>
		</div>
	);
}

function TransferPanel({
	students,
	onClose,
	onSuccess,
	onError,
	isTeacher,
}: {
	students: Student[];
	onClose: () => void;
	onSuccess: (message: string) => Promise<void>;
	onError: (message: string) => void;
	isTeacher: boolean;
}) {
	const [defaultTarget, setDefaultTarget] = useState("");
	const [destinations, setDestinations] = useState<Record<string, string>>({});
	const [effectiveOn, setEffectiveOn] = useState(today());
	const [reason, setReason] = useState("");
	const [saving, setSaving] = useState(false);
	const classGroups = useQuery({
		queryKey: ["academic", "class-groups", "active"],
		queryFn: () => api<ClassGroup[]>("/academic/class-groups?activeOnly=true"),
	});
	const valid = students.every((x) => destinations[x.id] || defaultTarget);
	async function submit() {
		if (!valid) return;
		setSaving(true);
		onError("");
		try {
			const result = await api<{ processed?: number; submitted?: number }>(isTeacher ? "/lifecycle/proposals/transfers" : "/lifecycle/transfers", {
				method: "POST",
				body: JSON.stringify({
					items: students.map((x) => ({
						studentId: x.id,
						targetClassGroupId: destinations[x.id] || defaultTarget,
						effectiveOn,
						reason: reason || undefined,
					})),
					reason: reason || undefined,
				}),
			});
			await onSuccess(isTeacher ? `${result.submitted} pengajuan perpindahan telah dikirim ke Kepala Sekolah.` : `${result.processed} murid berhasil dipindahkan.`);
		} catch (e) {
			onError(
				e instanceof Error ? e.message : "Perpindahan tidak dapat diproses.",
			);
		} finally {
			setSaving(false);
		}
	}
	return (
		<ActionPanel title="Atur perpindahan kelas" onClose={onClose}>
			<div className="mt-5 grid gap-3 md:grid-cols-2">
				<label className="text-sm font-medium">
					Kelas tujuan default
					<select
						value={defaultTarget}
						onChange={(e) => setDefaultTarget(e.target.value)}
						className="mt-1 w-full rounded-xl border p-3"
					>
						<option value="">Pilih kelas</option>
						{classGroups.data?.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
				</label>
				<label className="text-sm font-medium">
					Tanggal efektif
					<input
						type="date"
						value={effectiveOn}
						onChange={(e) => setEffectiveOn(e.target.value)}
						className="mt-1 w-full rounded-xl border p-3"
					/>
				</label>
				<label className="text-sm font-medium md:col-span-2">
					Alasan atau catatan (opsional)
					<textarea
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						className="mt-1 min-h-20 w-full rounded-xl border p-3"
					/>
				</label>
			</div>
			<h3 className="mt-6 font-bold">Tinjau murid dan tujuan</h3>
			<div className="mt-3 max-h-64 divide-y overflow-y-auto rounded-xl border">
				{students.map((x) => (
					<div
						key={x.id}
						className="grid gap-2 p-3 text-sm md:grid-cols-[1fr_220px]"
					>
						<span>
							<b>{x.name}</b>
							<span className="ml-2 text-slate-500">
								{x.class_name || "Belum ditempatkan"}
							</span>
						</span>
						<select
							value={destinations[x.id] || defaultTarget}
							onChange={(e) =>
								setDestinations((v) => ({ ...v, [x.id]: e.target.value }))
							}
							className="rounded-lg border p-2"
						>
							<option value="">Pilih tujuan</option>
							{classGroups.data?.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</select>
					</div>
				))}
			</div>
			<div className="mt-6 flex justify-end gap-2">
				<Button variant="secondary" onClick={onClose}>
					Batal
				</Button>
				<Button disabled={!valid || saving} onClick={() => void submit()}>
					{saving ? "Memproses…" : isTeacher ? "Ajukan perpindahan" : "Konfirmasi perpindahan"}
				</Button>
			</div>
		</ActionPanel>
	);
}

function GraduationPanel({
	students,
	onClose,
	onSuccess,
	onError,
	isTeacher,
}: {
	students: Student[];
	onClose: () => void;
	onSuccess: (message: string) => Promise<void>;
	onError: (message: string) => void;
	isTeacher: boolean;
}) {
	const [effectiveOn, setEffectiveOn] = useState(today());
	const [reason, setReason] = useState("");
	const [saving, setSaving] = useState(false);
	async function submit() {
		setSaving(true);
		onError("");
		try {
			const result = await api<{ processed?: number; submitted?: number }>(
				isTeacher ? "/lifecycle/proposals/graduations" : "/lifecycle/graduations",
				{
					method: "POST",
					body: JSON.stringify({
						studentIds: students.map((x) => x.id),
						effectiveOn,
						reason: reason || undefined,
					}),
				},
			);
			await onSuccess(isTeacher ? `${result.submitted} pengajuan kelulusan telah dikirim ke Kepala Sekolah.` : `${result.processed} murid telah masuk ke Arsip.`);
		} catch (e) {
			onError(
				e instanceof Error ? e.message : "Kelulusan tidak dapat diproses.",
			);
		} finally {
			setSaving(false);
		}
	}
	return (
		<ActionPanel title="Tinjau kelulusan" onClose={onClose}>
			<p className="mt-3 text-sm leading-6 text-slate-600">
				Murid yang dikonfirmasi lulus akan dipindahkan ke Arsip. Riwayat
				akademik dan rapor mereka tetap tersimpan.
			</p>
			<div className="mt-5 grid gap-3 md:grid-cols-2">
				<label className="text-sm font-medium">
					Tanggal kelulusan
					<input
						type="date"
						value={effectiveOn}
						onChange={(e) => setEffectiveOn(e.target.value)}
						className="mt-1 w-full rounded-xl border p-3"
					/>
				</label>
				<label className="text-sm font-medium">
					Alasan atau catatan (opsional)
					<input
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						className="mt-1 w-full rounded-xl border p-3"
					/>
				</label>
			</div>
			<div className="mt-5 rounded-xl border p-3 text-sm">
				<b>{students.length} murid akan masuk ke Arsip</b>
				<ul className="mt-2 list-disc space-y-1 pl-5">
					{students.map((x) => (
						<li key={x.id}>{x.name}</li>
					))}
				</ul>
			</div>
			<div className="mt-6 flex justify-end gap-2">
				<Button variant="secondary" onClick={onClose}>
					Batal
				</Button>
				<Button
					variant="danger"
					disabled={saving}
					onClick={() => void submit()}
				>
					{saving ? "Memproses…" : isTeacher ? "Ajukan kelulusan" : "Konfirmasi kelulusan"}
				</Button>
			</div>
		</ActionPanel>
	);
}
