"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", businessName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to create account.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-soft sm:p-8">
      {/* Header */}
      <div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Building2 size={20} />
        </span>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900">
          Create your workspace
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          A polished invoicing setup in under five minutes.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-slate-800">Your name</span>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              autoComplete="name"
              placeholder="Jane Smith"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
          </div>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-slate-800">Business name</span>
          <div className="relative">
            <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              placeholder="Acme Studio"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
          </div>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-slate-800">Email</span>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
          </div>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-slate-800">Password</span>
          <div className="relative">
            <LockKeyhole size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <span className="text-xs text-slate-400">Use at least 8 characters — mix letters and numbers.</span>
        </label>

        {error && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full py-3">
          Create account <ArrowRight size={16} />
        </Button>
      </form>

      {/* Trust badge */}
      <div className="mt-5 flex gap-3 rounded-2xl bg-emerald-50 p-4 text-xs leading-5 text-emerald-800">
        <ShieldCheck className="mt-0.5 shrink-0" size={16} />
        <span>
          Your password is hashed with bcrypt and your data is fully isolated to your account. We never share your data.
        </span>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700">
          Sign in
        </Link>
      </p>

      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
        <Mail size={13} /> No marketing emails. Ever.
      </div>
    </div>
  );
}
