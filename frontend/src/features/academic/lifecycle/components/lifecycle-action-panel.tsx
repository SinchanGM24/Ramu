import { ReactNode } from "react";
import { X } from "lucide-react";
import { ModalDialog } from "@/components/shared/modal-dialog";

export function LifecycleActionPanel({
	title,
	children,
	onClose,
}: {
	title: string;
	children: ReactNode;
	onClose: () => void;
}) {
	return (
		<ModalDialog
			title={title}
			eyebrow="Tindakan administratif"
			onClose={onClose}
			labelledBy="action-panel-title"
			wrapperClassName="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-[2px]"
			contentClassName="mx-auto my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
			headerClassName="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6"
			bodyClassName="p-5 sm:p-6"
			closeOnEscape
			closeOnBackdrop
			closeLabel="Tutup panel"
			closeButton={
				<button
					type="button"
					onClick={onClose}
					aria-label="Tutup panel"
					className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
				>
					<X size={20} />
				</button>
			}
		>
			{children}
		</ModalDialog>
	);
}
