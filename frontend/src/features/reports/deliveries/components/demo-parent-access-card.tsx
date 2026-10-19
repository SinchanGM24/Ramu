"use client";

import Link from "next/link";
import { Check, Copy, ExternalLink, KeyRound, Link2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { demoParentProfiles } from "@/lib/demo-parent-reports";

export function DemoParentAccessCard({ reportId }: { reportId: string }) {
	const profile = demoParentProfiles.find((item) => item.reportId === reportId);
	const [copied, setCopied] = useState(false);

	if (!profile) return null;

	const relativeLink = `/r/${profile.token}`;
	const publicLink =
		typeof window === "undefined"
			? relativeLink
			: `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${relativeLink}`;

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(publicLink);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2_000);
		} catch {
			setCopied(false);
		}
	}

	return (
		<Card className="mb-5 overflow-hidden border-brand-200 bg-[linear-gradient(115deg,#f0f7ee_0%,#fffefa_58%,#f6f9f2_100%)] p-0">
			<div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
				<div className="flex min-w-0 gap-3">
					<span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-700 text-white shadow-sm">
						<Link2 size={19} aria-hidden="true" />
					</span>
					<div className="min-w-0">
						<p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-700">
							Akses wali demo
						</p>
						<h2 className="mt-1 font-bold text-[#17251b]">Tautan dan PIN siap dicoba</h2>
						<p className="mt-1 text-sm leading-6 text-[#526156]">
							GitHub Pages tidak mengirim WhatsApp. Gunakan tautan ini untuk mencoba tampilan wali
							secara langsung.
						</p>
					</div>
				</div>
				<div className="flex shrink-0 flex-wrap items-center gap-2">
					<Link href={relativeLink} target="_blank">
						<Button variant="secondary">
							<ExternalLink className="mr-1.5 size-4" />
							Buka sebagai wali
						</Button>
					</Link>
					<Button variant="secondary" onClick={() => void copyLink()}>
						{copied ? <Check className="mr-1.5 size-4" /> : <Copy className="mr-1.5 size-4" />}
						{copied ? "Tersalin" : "Salin tautan"}
					</Button>
				</div>
			</div>
			<div className="grid gap-px border-t border-brand-100 bg-brand-100 sm:grid-cols-[minmax(0,1fr)_12rem]">
				<div className="min-w-0 bg-white/70 px-5 py-3 sm:px-6">
					<p className="text-xs font-semibold text-[#637065]">Tautan wali</p>
					<p className="mt-1 truncate font-mono text-xs text-brand-800" title={publicLink}>
						{publicLink}
					</p>
				</div>
				<div className="bg-white/70 px-5 py-3 sm:px-6">
					<p className="text-xs font-semibold text-[#637065]">PIN wali</p>
					<p className="mt-1 flex items-center gap-2 font-mono text-lg font-bold tracking-[0.16em] text-[#17251b]">
						<KeyRound className="size-4 text-brand-700" aria-hidden="true" />
						{profile.pin}
					</p>
				</div>
			</div>
		</Card>
	);
}
