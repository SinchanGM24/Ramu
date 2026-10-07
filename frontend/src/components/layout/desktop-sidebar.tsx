"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { demoRoleLabel, getDemoRole, isDemoMode } from "@/lib/demo-session";
import { navigation, secondaryNavigation } from "./navigation";

export function DesktopSidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState(getDemoRole());
  useEffect(() => setRole(getDemoRole()), []);
  const links = [...navigation, ...secondaryNavigation].filter((link) => !isDemoMode() || link.roles.includes(role));

  return <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-100 bg-white px-4 py-5 lg:block"><Link href="/app/dashboard" className="mb-9 flex items-center gap-3 px-2"><span className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white"><GraduationCap size={22} /></span><span><strong className="block text-lg tracking-tight text-slate-900">RAMU</strong><small className="text-xs text-slate-500">Raport Murid</small></span></Link><nav className="space-y-1">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", pathname.startsWith(href) ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50")}><Icon size={18} />{label}</Link>)}</nav><div className="absolute inset-x-4 bottom-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">TK Contoh Ceria<br /><strong className="text-slate-700">{isDemoMode() ? demoRoleLabel(role) : "Admin Sekolah"}</strong></div></aside>;
}
