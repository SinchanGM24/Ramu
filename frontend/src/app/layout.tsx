import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
export const metadata: Metadata = { title: "RAMU — Raport Murid", description: "Rapor digital yang rapi untuk sekolah PAUD" };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="id"><body><QueryProvider>{children}</QueryProvider></body></html>}
