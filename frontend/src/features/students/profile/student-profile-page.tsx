"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { EnrollmentHistory } from "./components/enrollment-history";
import { GuardiansSection } from "./components/guardians-section";
import { StudentIdentityCard } from "./components/student-identity-card";
import { StudentProfileForm } from "./components/student-profile-form";
import type { StudentProfile } from "./types";

export function StudentProfilePage({ id }: { id: string }) {
	const queryClient = useQueryClient();
	const [notice, setNotice] = useState("");
	const student = useQuery({
		queryKey: ["student", id],
		queryFn: () => api<StudentProfile | null>(`/students/${id}`),
	});
	const update = useMutation({
		mutationFn: (body: unknown) =>
			api(`/students/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
		onSuccess: () => {
			setNotice("Profil murid tersimpan.");
			queryClient.invalidateQueries({ queryKey: ["student", id] });
			queryClient.invalidateQueries({ queryKey: ["students"] });
		},
		onError: (error) =>
			setNotice(error instanceof Error ? error.message : "Profil murid belum tersimpan."),
	});

	if (student.isLoading) return <Card>Memuat profil murid…</Card>;
	if (!student.data) return <StudentNotFound />;

	const value = student.data;

	return (
		<>
			<PageHeader
				eyebrow="Data murid"
				title={`Profil ${value.name}`}
				description="Data ini tampil sebagai identitas baca-saja pada editor, pratinjau, dan rapor terbit."
				action={
					<Link href="/app/academic/students">
						<Button variant="secondary">
							<ArrowLeft className="mr-1 size-4" />
							Kembali
						</Button>
					</Link>
				}
			/>
			{notice ? <ProfileNotice notice={notice} /> : null}
			<StudentIdentityCard student={value} />
			<div className="space-y-6">
				<StudentProfileForm
					student={value}
					pending={update.isPending}
					onSubmit={(body) => update.mutate(body)}
				/>
				<EnrollmentHistory
					enrollments={value.enrollments ?? []}
					publishedReports={value.publishedReports ?? []}
				/>
				<GuardiansSection studentId={id} guardians={value.guardians} />
			</div>
		</>
	);
}

function StudentNotFound() {
	return (
		<Card>
			<h1 className="font-bold">Murid tidak ditemukan</h1>
			<Link
				href="/app/academic/students"
				className="mt-3 inline-block text-sm font-semibold text-brand-700"
			>
				Kembali ke data murid
			</Link>
		</Card>
	);
}

function ProfileNotice({ notice }: { notice: string }) {
	return (
		<p
			className={`mb-5 rounded-xl border p-3 text-sm ${notice.endsWith("tersimpan.") ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-red-100 bg-red-50 text-red-700"}`}
		>
			{notice}
		</p>
	);
}
