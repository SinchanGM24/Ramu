"use client";

import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PlatformAccountActions({
	isActive,
	onSetPassword,
	onChangeStatus,
}: {
	isActive: boolean;
	onSetPassword: () => void;
	onChangeStatus: () => void;
}) {
	const [open, setOpen] = useState(false);
	return (
		<div className="relative inline-flex">
			<Button type="button" variant="secondary" onClick={() => setOpen((value) => !value)}>
				Kelola <MoreHorizontal size={16} aria-hidden="true" />
			</Button>
			{open ? (
				<div className="absolute right-0 top-full z-10 mt-2 w-52 overflow-hidden rounded-xl border border-[#dfcdbf] bg-[#fffaf6] p-1.5 shadow-[0_12px_28px_rgba(80,54,39,0.16)]">
					<button
						type="button"
						className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#4e3428] hover:bg-[#f5e9df]"
						onClick={() => {
							setOpen(false);
							onSetPassword();
						}}
					>
						Atur ulang sandi
					</button>
					<div className="my-1 border-t border-[#ead9cc]" />
					<button
						type="button"
						className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
						onClick={() => {
							setOpen(false);
							onChangeStatus();
						}}
					>
						{isActive ? "Tangguhkan akun" : "Aktifkan akun"}
					</button>
				</div>
			) : null}
		</div>
	);
}
