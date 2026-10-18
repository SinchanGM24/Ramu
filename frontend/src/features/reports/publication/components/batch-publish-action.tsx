"use client";

import { useState } from "react";
import { Layers3 } from "lucide-react";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Button } from "@/components/ui/button";

type BatchPublishActionProps = {
	count: number;
	pending: boolean;
	progress?: { completed: number; total: number } | null;
	onPublish: () => void;
};

export function BatchPublishAction({
	count,
	pending,
	progress,
	onPublish,
}: BatchPublishActionProps) {
	const [open, setOpen] = useState(false);
	const label = progress
		? `Menerbitkan ${progress.completed}/${progress.total}`
		: `Terbitkan ${count} raport`;

	return (
		<>
			<Button disabled={!count || pending} onClick={() => setOpen(true)} className="shrink-0">
				<Layers3 className="size-4" aria-hidden="true" />
				{label}
			</Button>
			<ConfirmationDialog
				open={open}
				title="Terbitkan raport siap publikasi?"
				description={`${count} raport yang telah disetujui akan diterbitkan satu per satu sebagai versi final. Raport yang gagal diterbitkan tidak akan mengubah raport lainnya.`}
				confirmLabel="Terbitkan semua"
				onCancel={() => setOpen(false)}
				onConfirm={() => {
					setOpen(false);
					onPublish();
				}}
			/>
		</>
	);
}
