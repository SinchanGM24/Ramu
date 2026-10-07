"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AuthShell } from "./auth-shell";
import { DemoRolePicker } from "./demo-role-picker";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await api("/auth/login", { method: "POST", body: JSON.stringify({ email: data.get("email"), password: data.get("password") }) });
      router.push("/app/dashboard");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tidak dapat masuk");
    } finally {
      setLoading(false);
    }
  }

  return <AuthShell title="Selamat datang kembali" description={demoMode ? "Pilih persona untuk mencoba ruang kerja RAMU." : "Masuk untuk melanjutkan ke ruang kerja sekolah."} footer={<>Belum memiliki akun? <Link className="font-semibold text-brand-700" href="/register">Daftarkan sekolah</Link></>}>
    {demoMode ? <DemoRolePicker /> : <form onSubmit={submit} className="space-y-5"><label className="block text-sm font-semibold text-slate-700">Email<input required name="email" type="email" placeholder="nama@sekolah.id" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-brand-500" /></label><label className="block text-sm font-semibold text-slate-700">Kata sandi<input required name="password" type="password" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-brand-500" /></label>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Button className="w-full" disabled={loading}>{loading ? "Memproses…" : "Masuk"}</Button></form>}
  </AuthShell>;
}
