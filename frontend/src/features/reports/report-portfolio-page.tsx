"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileImage, ImagePlus, Images, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

type PortfolioItem = {
	id: string;
	original_filename: string;
	content_type: string;
	byte_size: number;
	caption?: string | null;
	included_in_report: boolean;
	created_at: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

export function ReportPortfolioPage({ reportId }: { reportId: string }) {
	const queryClient = useQueryClient();
	const [file, setFile] = useState<File>();
	const [caption, setCaption] = useState("");
	const [include, setInclude] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const items = useQuery({
		queryKey: ["report-portfolio", reportId],
		queryFn: () => api<PortfolioItem[]>(`/reports/${reportId}/portfolio`),
	});

	async function upload() {
		if (!file) return;
		setSaving(true);
		setError("");

		try {
			if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
				const form = new FormData();
				form.append("file", file);
				form.append("caption", caption);
				form.append("includedInReport", String(include));
				const response = await fetch(`${apiUrl}/api/reports/${reportId}/portfolio`, {
					method: "POST",
					credentials: "include",
					body: form,
				});

				if (!response.ok) throw new Error();
			}

			setFile(undefined);
			setCaption("");
			await queryClient.invalidateQueries({ queryKey: ["report-portfolio", reportId] });
		} catch {
			setError(
				"Foto portfolio tidak dapat diunggah. Gunakan JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.",
			);
		} finally {
			setSaving(false);
		}
	}

	return (
		<>
			<PageHeader
				eyebrow="Portfolio murid"
				title="Dokumentasi perkembangan"
				description="Simpan foto dan keterangan pendukung secara aman. Hanya item yang dipilih yang akan dimasukkan pada rapor terbit."
				action={
					<Link href={`/app/reports/${reportId}`}>
						<Button variant="secondary">Kembali ke rapor</Button>
					</Link>
				}
			/>

			<Card className="overflow-hidden p-0">
				<div className="border-b border-[#e3e7dc] bg-[#f4f7f1] px-5 py-5 sm:px-6">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-brand-700 shadow-sm">
							<ImagePlus className="size-5" />
						</div>
						<div>
							<h2 className="font-display text-lg font-bold text-[#17251b]">
								Tambahkan dokumentasi
							</h2>
							<p className="mt-1 text-sm leading-6 text-[#637065]">
								Unggah foto kegiatan yang membantu menjelaskan perkembangan murid.
							</p>
						</div>
					</div>
				</div>

				<div className="grid gap-5 px-5 py-5 sm:grid-cols-2 sm:px-6 sm:py-6">
					<label className="grid min-h-44 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-brand-200 bg-[#f8fbf6] p-5 text-center transition hover:border-brand-400 hover:bg-brand-50 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
						<input
							className="sr-only"
							type="file"
							accept="image/jpeg,image/png,image/webp"
							onChange={(event) => setFile(event.target.files?.[0])}
						/>
						<ImagePlus className="size-8 text-brand-600" />
						<span className="mt-3 text-sm font-semibold text-brand-700">
							{file ? file.name : "Pilih foto portfolio"}
						</span>
						<span className="mt-1 text-xs text-[#637065]">JPG, PNG, atau WebP · maksimal 5 MB</span>
					</label>

					<div className="flex flex-col">
						<label className="block text-sm font-semibold text-[#17251b]">
							Keterangan foto
							<textarea
								value={caption}
								onChange={(event) => setCaption(event.target.value.slice(0, 500))}
								maxLength={500}
								className="mt-2 min-h-24 w-full rounded-xl border border-[#d9dfd4] bg-[#fffdf8] p-3 text-sm text-[#17251b] outline-none transition placeholder:text-[#8a9489] focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
								placeholder="Ceritakan kegiatan atau perkembangan yang terlihat..."
							/>
						</label>

						<div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-[#e3e7dc] bg-[#f8faf6] px-4 py-3">
							<div>
								<p className="text-sm font-semibold text-[#17251b]">Sertakan pada rapor terbit</p>
								<p className="mt-0.5 text-xs leading-5 text-[#637065]">
									Foto ini akan tampil pada rapor saat diterbitkan.
								</p>
							</div>
							<Switch
								checked={include}
								onChange={setInclude}
								aria-label="Sertakan foto pada rapor terbit"
							/>
						</div>

						<Button className="mt-4 gap-2 self-start" disabled={!file || saving} onClick={upload}>
							<Upload size={16} />
							{saving ? "Mengunggah..." : "Unggah foto"}
						</Button>
					</div>
				</div>

				{error && (
					<p className="mx-5 mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6 sm:mb-6">
						{error}
					</p>
				)}
			</Card>

			<div className="mt-7 flex items-end justify-between gap-4">
				<div>
					<p className="eyebrow">Dokumentasi tersimpan</p>
					<h2 className="mt-1 font-display text-xl font-bold text-[#17251b]">Foto portfolio</h2>
				</div>
				{items.data?.length ? (
					<span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
						<Images className="size-3.5" />
						{items.data.length} foto
					</span>
				) : null}
			</div>

			<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{items.data?.map((item) => (
					<Card key={item.id} className="border-[#e3e7dc] bg-[#fffdf8] p-5 shadow-sm">
						<div className="flex items-start gap-3">
							<div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
								<FileImage className="size-5" />
							</div>
							<div className="min-w-0">
								<p className="truncate font-semibold text-[#17251b]">{item.original_filename}</p>
								<p className="mt-1 text-xs text-[#637065]">
									{Math.ceil(item.byte_size / 1024)} KB ·{" "}
									{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
										new Date(item.created_at),
									)}
								</p>
							</div>
						</div>
						{item.caption && (
							<p className="mt-4 text-sm leading-6 text-[#637065]">{item.caption}</p>
						)}
						<p className="mt-4 inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
							{item.included_in_report ? "Disertakan pada rapor" : "Tidak disertakan pada rapor"}
						</p>
					</Card>
				))}
			</div>

			{items.data?.length === 0 && (
				<Card className="mt-4 border-dashed border-[#d9dfd4] bg-[#f8faf6] py-10 text-center">
					<FileImage className="mx-auto size-8 text-brand-600" />
					<p className="mt-3 text-sm font-semibold text-[#17251b]">Belum ada foto portfolio</p>
					<p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[#637065]">
						Pilih foto kegiatan atau karya murid untuk melengkapi dokumentasi perkembangan.
					</p>
				</Card>
			)}
		</>
	);
}
