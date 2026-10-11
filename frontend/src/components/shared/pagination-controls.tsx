"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaginationControls({ page, pageSize, total, onPageChange }: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  if (total <= pageSize) return total ? <p className="mt-4 text-sm text-slate-500">Menampilkan {start}–{end} dari {total} data</p> : null;
  return <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><p className="text-sm text-slate-500">Menampilkan {start}–{end} dari {total} data</p><div className="flex items-center gap-2"><Button type="button" variant="secondary" className="min-h-9 px-3" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={16} />Sebelumnya</Button><span className="text-sm font-medium text-slate-600">Halaman {page} dari {pageCount}</span><Button type="button" variant="secondary" className="min-h-9 px-3" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>Berikutnya<ChevronRight size={16} /></Button></div></div>;
}
