import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { ReportWorkspace } from "../types";

type SemesterDataFormProps = {
	attendance: ReportWorkspace["attendance"];
	editable: boolean;
	growth: ReportWorkspace["growth"];
	reportId: string;
	onSaved: () => void;
};

type SemesterDataValues = {
	heightCm: string;
	headCircumferenceCm: string;
	permissionDays: string;
	sickDays: string;
	unexcusedDays: string;
	weightKg: string;
};

function optionalNumber(value: string) {
	return value === "" ? undefined : Number(value);
}

function valuesFromData(
	growth: ReportWorkspace["growth"],
	attendance: ReportWorkspace["attendance"],
): SemesterDataValues {
	return {
		weightKg: growth?.weight_kg?.toString() ?? "",
		heightCm: growth?.height_cm?.toString() ?? "",
		headCircumferenceCm: growth?.head_circumference_cm?.toString() ?? "",
		sickDays: attendance?.sick_days?.toString() ?? "0",
		permissionDays: attendance?.permission_days?.toString() ?? "0",
		unexcusedDays: attendance?.unexcused_days?.toString() ?? "0",
	};
}

export function SemesterDataForm({
	attendance,
	editable,
	growth,
	reportId,
	onSaved,
}: SemesterDataFormProps) {
	const [values, setValues] = useState(() => valuesFromData(growth, attendance));
	const [error, setError] = useState("");
	const save = useMutation({
		mutationFn: () =>
			api(`/reports/${reportId}/semester-data`, {
				method: "PUT",
				body: JSON.stringify({
					weightKg: optionalNumber(values.weightKg),
					heightCm: optionalNumber(values.heightCm),
					headCircumferenceCm: optionalNumber(values.headCircumferenceCm),
					sickDays: Number(values.sickDays),
					permissionDays: Number(values.permissionDays),
					unexcusedDays: Number(values.unexcusedDays),
				}),
			}),
		onSuccess: () => {
			setError("");
			onSaved();
		},
		onError: (cause) => {
			setError(
				cause instanceof Error ? cause.message : "Data akhir semester belum dapat disimpan.",
			);
		},
	});

	useEffect(() => {
		setValues(valuesFromData(growth, attendance));
	}, [attendance, growth]);

	function update(field: keyof SemesterDataValues, value: string) {
		setValues((current) => ({ ...current, [field]: value }));
	}

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		save.mutate();
	}

	return (
		<Card id="data-akhir-semester" className="scroll-mt-6" data-report-semester-data="true">
			<div>
				<p className="text-xs font-bold text-brand-700">DATA AKHIR SEMESTER</p>
				<h2 className="mt-1 text-lg font-bold text-slate-900">Pertumbuhan dan kehadiran</h2>
			</div>
			<form className="mt-5 space-y-5" onSubmit={submit}>
				<fieldset disabled={!editable || save.isPending}>
					<legend className="text-sm font-semibold text-slate-800">Data pertumbuhan</legend>
					<div className="mt-3 grid gap-4 sm:grid-cols-3">
						<NumberField
							label="Berat badan (kg)"
							min="0"
							name="weightKg"
							step="0.01"
							value={values.weightKg}
							onChange={(value) => update("weightKg", value)}
						/>
						<NumberField
							label="Tinggi badan (cm)"
							min="0"
							name="heightCm"
							step="0.01"
							value={values.heightCm}
							onChange={(value) => update("heightCm", value)}
						/>
						<NumberField
							label="Lingkar kepala (cm)"
							min="0"
							name="headCircumferenceCm"
							step="0.01"
							value={values.headCircumferenceCm}
							onChange={(value) => update("headCircumferenceCm", value)}
						/>
					</div>
				</fieldset>
				<fieldset disabled={!editable || save.isPending}>
					<legend className="text-sm font-semibold text-slate-800">Kehadiran</legend>
					<div className="mt-3 grid gap-4 sm:grid-cols-3">
						<NumberField
							label="Sakit (hari)"
							min="0"
							name="sickDays"
							required
							step="1"
							value={values.sickDays}
							onChange={(value) => update("sickDays", value)}
						/>
						<NumberField
							label="Izin (hari)"
							min="0"
							name="permissionDays"
							required
							step="1"
							value={values.permissionDays}
							onChange={(value) => update("permissionDays", value)}
						/>
						<NumberField
							label="Tanpa keterangan (hari)"
							min="0"
							name="unexcusedDays"
							required
							step="1"
							value={values.unexcusedDays}
							onChange={(value) => update("unexcusedDays", value)}
						/>
					</div>
				</fieldset>
				{editable ? (
					<Button type="submit" disabled={save.isPending}>
						{save.isPending ? "Menyimpan…" : "Simpan data akhir semester"}
					</Button>
				) : null}
				{error ? (
					<p role="alert" className="text-sm text-red-700">
						{error}
					</p>
				) : null}
				{save.isSuccess ? (
					<p className="text-sm text-emerald-700">Data akhir semester tersimpan.</p>
				) : null}
			</form>
		</Card>
	);
}

function NumberField({
	label,
	min,
	name,
	required,
	step,
	value,
	onChange,
}: {
	label: string;
	min: string;
	name: string;
	required?: boolean;
	step: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<label className="block text-sm font-medium text-slate-700">
			{label}
			<input
				min={min}
				name={name}
				required={required}
				step={step}
				type="number"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
			/>
		</label>
	);
}
