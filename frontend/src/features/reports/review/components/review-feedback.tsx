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
			className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ${tone === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-red-100 bg-red-50 text-red-700"}`}
		>
			{children}
		</div>
	);
}
