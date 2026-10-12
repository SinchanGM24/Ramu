"use client";

import { ReactNode, useEffect } from "react";

type ModalDialogProps = {
	children: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	onClose: () => void;
	labelledBy: string;
	eyebrow?: ReactNode;
	contentClassName: string;
	wrapperClassName?: string;
	headerClassName?: string;
	bodyClassName?: string;
	closeLabel?: string;
	closeOnEscape?: boolean;
	closeOnBackdrop?: boolean;
	closeButton?: ReactNode;
	titleClassName?: string;
};

/** Shared dialog shell. Visual spacing remains controlled by each feature. */
export function ModalDialog({
	children,
	title,
	description,
	onClose,
	labelledBy,
	eyebrow,
	contentClassName,
	wrapperClassName = "fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4",
	headerClassName = "flex items-start justify-between gap-4",
	bodyClassName = "",
	closeLabel = "Tutup dialog",
	closeOnEscape = false,
	closeOnBackdrop = false,
	closeButton,
	titleClassName,
}: ModalDialogProps) {
	useEffect(() => {
		if (!closeOnEscape) return;
		const close = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", close);
		return () => window.removeEventListener("keydown", close);
	}, [closeOnEscape, onClose]);

	return (
		<div
			className={wrapperClassName}
			onMouseDown={(event) => {
				if (closeOnBackdrop && event.target === event.currentTarget) onClose();
			}}
		>
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby={labelledBy}
				className={contentClassName}
			>
				<div className={headerClassName}>
					<div>
						{eyebrow ? (
							<p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
								{eyebrow}
							</p>
						) : null}
						<h2
							id={labelledBy}
							className={
								titleClassName ?? (eyebrow ? "mt-1 text-xl font-bold text-slate-950" : "font-bold")
							}
						>
							{title}
						</h2>
						{description ? (
							<p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
						) : null}
					</div>
					{closeButton ?? (
						<button
							type="button"
							onClick={onClose}
							aria-label={closeLabel}
							className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
						>
							×
						</button>
					)}
				</div>
				<div className={bodyClassName}>{children}</div>
			</section>
		</div>
	);
}
