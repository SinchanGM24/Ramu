"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigation } from "./navigation";
export function MobileBottomNav(){const pathname=usePathname();return <nav aria-label="Navigasi utama" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">{navigation.map(({href,label,icon:Icon})=>{const active=pathname.startsWith(href);return <Link key={href} href={href} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",active?"text-brand-700":"text-slate-500")}><Icon size={20} strokeWidth={active?2.5:2}/>{label}</Link>})}</nav>}
