import Link from "next/link";
import { ReceiptText } from "lucide-react";

export function Logo({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return <Link href="/" className="inline-flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm"><ReceiptText size={19}/></span>{!compact && <span className={`text-xl font-black tracking-tight ${dark ? "text-white" : "text-ink"}`}>Bill<span className="text-brand-600">Flow</span></span>}</Link>;
}
