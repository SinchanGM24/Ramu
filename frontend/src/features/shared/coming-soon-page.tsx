import { Construction } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
export function ComingSoonPage({title,description}:{title:string;description:string}){return <><PageHeader title={title} description={description}/><Card className="grid min-h-64 place-items-center text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Construction/></span><h2 className="mt-4 font-bold">Tahap berikutnya</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Halaman ini telah disiapkan dalam navigasi dan akan dihubungkan saat modul domainnya diimplementasikan.</p></div></Card></>}
