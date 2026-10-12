import type { ReactNode } from "react";

export function ReviewFeedback({
	children,
	tone,
}: {
	children: ReactNode;
	tone: "error" | "success";
}) {
	return (
		<div
			role={tone === "error" ? "alert" : "status"}
			className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${tone === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
		>
			{children}
		</div>
	);
}
