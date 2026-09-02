import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Logo />
        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft sm:p-14">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <FileQuestion size={25} />
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[.16em] text-brand-600">404</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">That page is not available</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">The link may be incorrect, expired, or the resource is no longer visible.</p>
          <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
            <ArrowLeft size={16} /> Back to BillFlow
          </Link>
        </section>
      </div>
    </main>
  );
}
