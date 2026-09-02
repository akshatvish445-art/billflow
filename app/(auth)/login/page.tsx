"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { Button, Field } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to sign in.");
      setLoading(false);
      return;
    }
    const next = search.get("next");
    const destination =
      next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    router.push(destination);
    router.refresh();
  };

  const fillDemo = () => {
    setForm({ email: "demo@billflow.app", password: "Demo@12345" });
    setShowDemo(false);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-soft sm:p-8">
      {/* Header */}
      <div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-white">
          <LockKeyhole size={20} />
        </span>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Sign in to your BillFlow workspace.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={submit} className="mt-7 space-y-4">
        <div className="space-y-1.5">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-slate-800">Email</span>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-slate-800">Password</span>
            <div className="relative">
              <LockKeyhole size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
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
          </label>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full py-3">
          Sign in <ArrowRight size={16} />
        </Button>
      </form>

      {/* Demo hint */}
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setShowDemo(!showDemo)}
          className="flex w-full items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-xs font-medium text-slate-500 hover:bg-slate-100 transition"
        >
          <Sparkles size={13} className="text-indigo-400" />
          Want to try a demo account?
          <span className="ml-auto text-xs text-slate-400">{showDemo ? "Hide" : "Show"}</span>
        </button>
        {showDemo && (
          <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 text-xs text-slate-600">
            <p><span className="font-semibold">Email:</span> demo@billflow.app</p>
            <p><span className="font-semibold">Password:</span> Demo@12345</p>
            <button
              type="button"
              onClick={fillDemo}
              className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
            >
              Fill credentials
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        New here?{" "}
        <Link href="/signup" className="font-bold text-indigo-600 hover:text-indigo-700">
          Create an account
        </Link>
      </p>
    </div>
  );
}
