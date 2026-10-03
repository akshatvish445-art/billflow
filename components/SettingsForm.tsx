"use client";

import { useState } from "react";
import {
  Building2,
  Check,
  CreditCard,
  FileCheck,
  ImagePlus,
  Landmark,
  Save,
  ShieldCheck,
  Sliders,
  Sparkles,
} from "lucide-react";
import { Button, Field } from "@/components/ui";
import BillingSection from "@/components/BillingSection";
import { INDIAN_STATES, parseGstin } from "@/lib/gst";

interface UserSettingsData {
  businessName: string;
  currency: string;
  invoicePrefix: string;
  logoData: string | null;
  plan: string;
  planStatus: string;
  planPeriod: string;
  isGstRegistered: boolean;
  gstin: string;
  pan: string;
  businessAddress: string;
  state: string;
  stateCode: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankBranch: string;
  upiId: string;
}

export default function SettingsForm({
  user,
  currencies,
}: {
  user: UserSettingsData;
  currencies: { code: string; label: string; symbol: string }[];
}) {
  const [activeTab, setActiveTab] = useState<"general" | "gst" | "billing">("general");
  const [form, setForm] = useState<UserSettingsData>(user);
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

  const handleGstinChange = (value: string) => {
    const clean = value.toUpperCase().trim();
    const parsed = parseGstin(clean);
    if (parsed.isValid) {
      setForm((prev) => ({
        ...prev,
        gstin: clean,
        pan: parsed.pan || prev.pan,
        stateCode: parsed.stateCode || prev.stateCode,
        state: parsed.stateName || prev.state,
      }));
    } else {
      setForm((prev) => ({ ...prev, gstin: clean }));
    }
  };

  const handleStateCodeChange = (code: string) => {
    const found = INDIAN_STATES.find((s) => s.code === code);
    setForm((prev) => ({
      ...prev,
      stateCode: code,
      state: found?.name || prev.state,
    }));
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
        body: JSON.stringify(form),
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
      setTimeout(() => setSaved(false), 2400);
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
            Configure your organization identity, GST compliance, and billing tiers.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition ${
              activeTab === "general"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-ink hover:bg-slate-100"
            }`}
          >
            <Sliders size={15} /> General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gst")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition ${
              activeTab === "gst"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-ink hover:bg-slate-100"
            }`}
          >
            <Building2 size={15} /> Organization & GST
            {form.isGstRegistered && (
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                GST Active
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("billing")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition ${
              activeTab === "billing"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 hover:text-ink hover:bg-slate-100"
            }`}
          >
            <CreditCard size={15} /> Subscription
          </button>
        </div>
      </div>

      {/* Tab 1: General & Profile */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel sm:p-7">
            <h2 className="text-lg font-black text-ink">Business Profile</h2>
            <p className="mt-1 text-xs text-slate-500">
              Details displayed across invoices, PDFs, and client payment portals.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field
                label="Business / Organization Name"
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
      )}

      {/* Tab 2: Organization GST & Compliance */}
      {activeTab === "gst" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* GST Registered Toggle Banner */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-ink">GST Registration Status</h2>
                  {form.isGstRegistered ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      <ShieldCheck size={13} /> Active GSTIN
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                      Standard Invoicing (No GST)
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Enable if your business or organization is registered under Indian GST. Invoices will automatically calculate CGST, SGST, or IGST and output official TAX INVOICES.
                </p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={form.isGstRegistered}
                  onChange={(e) => setForm({ ...form, isGstRegistered: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="peer h-7 w-13 rounded-full bg-slate-200 after:absolute after:left-[3px] after:top-[3px] after:h-5.5 after:w-5.5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-6 peer-focus:outline-none"></div>
              </label>
            </div>

            {form.isGstRegistered && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Field
                      label="GSTIN (Goods and Services Tax ID)"
                      required={form.isGstRegistered}
                      placeholder="e.g. 09ABCDE1234F1Z5"
                      value={form.gstin}
                      onChange={(e) => handleGstinChange(e.target.value)}
                      hint="15 characters: State Code (2) + PAN (10) + Entity (3)"
                    />
                  </div>
                  <div>
                    <Field
                      label="PAN (Permanent Account Number)"
                      placeholder="e.g. ABCDE1234F"
                      value={form.pan}
                      onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                      hint="Automatically inferred from GSTIN"
                    />
                  </div>

                  <div>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-800">
                        State & GST State Code
                      </span>
                      <select
                        value={form.stateCode}
                        onChange={(e) => handleStateCodeChange(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.code} — {s.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div>
                    <Field
                      label="Registered State Name"
                      value={form.state}
                      readOnly
                      hint="Selected from official GST state list"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-800">
                        Registered Business Address
                      </span>
                      <textarea
                        rows={2}
                        value={form.businessAddress}
                        onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
                        placeholder="Suite #, Building, Street, City, State, PIN Code"
                        className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Bank & Settlement Details */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel sm:p-7">
            <div className="flex items-center gap-2">
              <Landmark size={20} className="text-brand-600" />
              <h2 className="text-lg font-black text-ink">Settlement & Wire Transfer Details</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Printed on the official TAX INVOICE so clients can initiate RTGS/NEFT/IMPS or scan UPI directly.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field
                label="Bank Name"
                placeholder="e.g. HDFC Bank, ICICI Bank"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              />
              <Field
                label="Account Number"
                placeholder="e.g. 50200012345678"
                value={form.bankAccountNo}
                onChange={(e) => setForm({ ...form, bankAccountNo: e.target.value })}
              />
              <Field
                label="IFSC Code"
                placeholder="e.g. HDFC0001234"
                value={form.bankIfsc}
                onChange={(e) => setForm({ ...form, bankIfsc: e.target.value.toUpperCase() })}
              />
              <Field
                label="Branch Location"
                placeholder="e.g. Connaught Place, New Delhi"
                value={form.bankBranch}
                onChange={(e) => setForm({ ...form, bankBranch: e.target.value })}
              />
              <div className="sm:col-span-2">
                <Field
                  label="UPI ID / VPA (Optional)"
                  placeholder="e.g. organization@okaxis, business@upi"
                  value={form.upiId}
                  onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                  hint="Allows clients on the payment portal to pay instantly via PhonePe/GPay/Paytm"
                />
              </div>
            </div>
          </section>

          {/* Tax Compliance Guarantee Box */}
          <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-5 text-xs text-brand-900">
            <FileCheck size={18} className="shrink-0 text-brand-600" />
            <p className="leading-relaxed">
              When GST is active, BillFlow automatically inspects the buyer&apos;s state against your organization state (<b>{form.state || "Not configured"}</b>). Same-state transactions split into <b>CGST + SGST</b>; inter-state transactions calculate <b>IGST</b>.
            </p>
          </div>

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
                  <Save size={16} /> Save GST Configuration
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Tab 3: Billing & Subscription */}
      {activeTab === "billing" && (
        <BillingSection
          initialPlan={user.plan}
          initialStatus={user.planStatus}
          initialPeriod={user.planPeriod}
        />
      )}
    </div>
  );
}
