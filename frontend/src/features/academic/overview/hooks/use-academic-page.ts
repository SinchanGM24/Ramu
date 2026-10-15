import { FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAcademicYears } from "./use-academic-years";
import { useClassPeriods } from "./use-class-periods";
import { useAcademicSemesters } from "./use-academic-semesters";
import type { ClassPeriod } from "../types";

export function useAcademicPage() {
	const queryClient = useQueryClient();
	const years = useAcademicYears();
	const semesters = useAcademicSemesters();
	const periods = useClassPeriods(years.activeYear?.id);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [isYearFormOpen, setYearFormOpen] = useState(false);
	const [isClassFormOpen, setClassFormOpen] = useState(false);
	const [isYearSwitchOpen, setYearSwitchOpen] = useState(false);
	const [managedPeriod, setManagedPeriod] = useState<ClassPeriod | null>(null);
	async function request(
		path: string,
		body: object,
		queryKey: readonly unknown[],
		close: () => void,
	) {
		setError("");
		try {
			await api(path, { method: "POST", body: JSON.stringify(body) });
			close();
			await queryClient.invalidateQueries({ queryKey });
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Data tidak dapat disimpan.");
		}
	}
	function submitYear(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const startDate = String(new FormData(event.currentTarget).get("startDate") || "");
		setError("");
		void api<{ name: string; is_active: boolean }>("/academic/years", {
			method: "POST",
			body: JSON.stringify({ name: startDate.slice(0, 4) }),
		})
			.then(async (year) => {
				setYearFormOpen(false);
				setNotice(
					year.is_active
						? `Tahun ajaran ${year.name} berhasil dibuat dan menjadi tahun aktif pertama.`
						: `Tahun ajaran ${year.name} berhasil ditambahkan. Aktifkan saat siap digunakan.`,
				);
				await queryClient.invalidateQueries({ queryKey: ["academic", "years"] });
				await queryClient.invalidateQueries({ queryKey: ["academic", "semesters"] });
				await queryClient.invalidateQueries({ queryKey: ["academic", "active-semester"] });
			})
			.catch((reason) =>
				setError(reason instanceof Error ? reason.message : "Tahun ajaran tidak dapat dibuat."),
			);
	}
	function submitClass(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (years.activeYear)
			void request(
				"/academic/class-periods",
				{
					name: new FormData(event.currentTarget).get("name"),
					academicYearId: years.activeYear.id,
				},
				["academic", "class-periods", years.activeYear.id],
				() => setClassFormOpen(false),
			);
	}
	const activateYear = (id: string, semesterId: string) =>
		request(`/academic/years/${id}/activate`, { semesterId }, ["academic", "years"], () =>
			setYearSwitchOpen(false),
		).then(async () => {
			await queryClient.invalidateQueries({ queryKey: ["academic", "semesters"] });
			await queryClient.invalidateQueries({ queryKey: ["academic", "active-semester"] });
			await queryClient.invalidateQueries({ queryKey: ["reports"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		});
	return {
		years,
		semesters,
		periods,
		error,
		notice,
		isYearFormOpen,
		isClassFormOpen,
		isYearSwitchOpen,
		managedPeriod,
		setYearFormOpen,
		setClassFormOpen,
		setYearSwitchOpen,
		setManagedPeriod,
		submitYear,
		submitClass,
		activateYear,
	};
}
