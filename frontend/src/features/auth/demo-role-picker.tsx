"use client";

import { BriefcaseBusiness, GraduationCap, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { DemoRole, demoRoles, setDemoRole } from "@/lib/demo-session";

const icons = { SCHOOL_ADMIN: ShieldCheck, TEACHER: GraduationCap, PRINCIPAL: BriefcaseBusiness };

export function DemoRolePicker() {
  const router = useRouter();
  function enter(role: DemoRole) {
    setDemoRole(role);
    router.push("/app/dashboard");
  }

  return <section className="rounded-2xl border border-brand-100 bg-brand-50 p-4"><p className="text-sm font-bold text-brand-800">Coba sebagai</p><p className="mt-1 text-xs leading-5 text-slate-600">Pilih persona untuk melihat pengalaman sesuai peran. Ini hanya data contoh di browser.</p><div className="mt-3 space-y-2">{demoRoles.map((item) => { const Icon = icons[item.role]; return <button key={item.role} type="button" onClick={() => enter(item.role)} className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-100 transition hover:ring-brand-300"><span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon size={18} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">{item.label}</span><span className="block text-xs text-slate-500">{item.description}</span></span><span className="text-xs font-bold text-brand-700">Masuk</span></button>; })}</div></section>;
}
