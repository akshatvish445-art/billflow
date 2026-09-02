import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-sky-100/60 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-100/40 blur-2xl" />
      </div>

      {/* Content */}
      <div className="relative mx-auto flex max-w-md flex-col px-5 py-10">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* Card */}
        <div className="mt-10">{children}</div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-400">
          Secure account access &middot; Passwords hashed with bcrypt &middot; Data never shared
        </p>
      </div>
    </main>
  );
}
