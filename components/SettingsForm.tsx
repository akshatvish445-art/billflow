"use client";

import { useState } from "react";
import { Check, CreditCard, ImagePlus, Save, Sliders, Sparkles } from "lucide-react";
import { Button, Field } from "@/components/ui";
import BillingSection from "@/components/BillingSection";

export default function SettingsForm({
  user,
  currencies,
}: {
  user: {
    businessName: string;
    currency: string;
    invoicePrefix: string;
    logoData: string | null;
    plan: string;
    planStatus: string;
    planPeriod: string;
  };
  currencies: { code: string; label: string; symbol: string }[];
}) {
  const [activeTab, setActiveTab] = useState<"general" | "billing">("general");
  const [form, setForm] = useState(user);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4_500_000) {
      setError("Logo is too large. Keep it under 4.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, logoData: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          currency: form.currency,
          invoicePrefix: form.invoicePrefix,
          logoData: form.logoData,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save settings");
        setSaving(false);
        return;
      }
      setForm((prev) => ({ ...prev, ...data.user }));
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch {
      setError("Failed to save settings. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-600">Workspace Management</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-ink">Settings</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Configure your workspace identity, invoices, and subscription plans.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
              activeTab === "general"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-ink hover:bg-slate-100"
            }`}
          >
            <Sliders size={16} /> General & Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("billing")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
              activeTab === "billing"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 hover:text-ink hover:bg-slate-100"
            }`}
          >
            <CreditCard size={16} /> Plans & Subscription
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "general" ? (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel sm:p-7">
            <h2 className="text-lg font-black text-ink">Business Profile</h2>
            <p className="mt-1 text-xs text-slate-500">
              Details displayed across invoices, PDFs, and client payment portals.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field
                label="Business Name"
                required
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              />
              <Field
                label="Invoice Number Prefix"
                required
                value={form.invoicePrefix}
                onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value.toUpperCase() })}
                hint="Example: NST → NST-1001"
              />
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-800">Default Currency</span>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.label} ({c.symbol})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-ink text-sm font-black text-white shadow-sm">
                {form.logoData ? (
                  <img src={form.logoData} alt="Business logo" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus size={26} />
                )}
              </div>
              <div>
                <h2 className="text-lg font-black text-ink">Business Logo</h2>
                <p className="mt-1 text-xs text-slate-400">
                  PNG, JPG or SVG under 4.5 MB. Automatically displayed on all generated PDFs and client invoices.
                </p>
                <div className="mt-3.5 flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
                    <ImagePlus size={14} /> Upload New Logo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  {form.logoData && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, logoData: null })}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              {saved ? (
                <>
                  <Check size={16} /> Saved Successfully
                </>
              ) : (
                <>
                  <Save size={16} /> Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <BillingSection
          initialPlan={user.plan}
          initialStatus={user.planStatus}
          initialPeriod={user.planPeriod}
        />
      )}
    </div>
  );
}
