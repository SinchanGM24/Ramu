"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ParentAccessForm } from "./components/parent-access-form";
import { ParentReportContent } from "./components/parent-report-content";
import type { ParentReport } from "./types";

export function ParentReportViewer({ token }: { token: string }) {
	const [pin, setPin] = useState("");
	const [report, setReport] = useState<ParentReport>();
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

	async function load() {
		const result = await api<{ report: ParentReport }>("/parent/report");
		setReport(result.report);
	}

	useEffect(() => {
		if (!demo) void load().catch(() => undefined);
	}, [demo]);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError("");
		try {
			await api("/parent/verify", { method: "POST", body: JSON.stringify({ token, pin }) });
			await load();
		} catch {
			setError("PIN atau tautan tidak valid.");
		} finally {
			setLoading(false);
		}
	}

	async function download() {
		if (demo) return window.print();
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001"}/api/parent/report-pdf`,
			{ credentials: "include" },
		);
		if (!response.ok) {
			setError("PDF raport belum dapat diunduh.");
			return;
		}
		const url = URL.createObjectURL(await response.blob());
		const link = document.createElement("a");
		link.href = url;
		link.download = "raport-anak.pdf";
		link.click();
		URL.revokeObjectURL(url);
	}

	if (!report)
		return (
			<ParentAccessForm
				demo={demo}
				error={error}
				loading={loading}
				pin={pin}
				onPinChange={setPin}
				onSubmit={submit}
			/>
		);
	return <ParentReportContent report={report} error={error} onDownload={() => void download()} />;
}
