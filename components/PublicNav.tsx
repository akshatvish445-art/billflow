import Link from "next/link";
import { Logo } from "@/components/Logo";

export function PublicNav() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Logo />
      <div className="flex items-center gap-3">
        <a href="#pricing" className="hidden sm:inline-block rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-ink hover:bg-slate-100 transition">
          Pricing
        </a>
        <a href="#features" className="hidden sm:inline-block rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-ink hover:bg-slate-100 transition">
          Features
        </a>
        <Link href="/login" className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
          Log in
        </Link>
        <Link href="/signup" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition">
          Get started
        </Link>
      </div>
    </header>
  );
}
