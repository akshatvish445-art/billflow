"use client";

import { FileDown, Printer } from "lucide-react";

export function PrintInvoiceButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-ink active:scale-[0.98]"
    >
      <Printer size={16} /> Print / Save as PDF
    </button>
  );
}
