"use client";

import { useState } from "react";
import { Check, Crown, Zap, Shield, ArrowRight, Sparkles, AlertCircle, CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

type PlanId = "STARTER" | "PRO";

interface BillingSectionProps {
  initialPlan?: string;
  initialStatus?: string;
  initialPeriod?: string;
}

export default function BillingSection({
  initialPlan = "STARTER",
  initialStatus = "ACTIVE",
  initialPeriod = "MONTHLY",
}: BillingSectionProps) {
  const [currentPlan, setCurrentPlan] = useState<PlanId>(initialPlan === "PRO" ? "PRO" : "STARTER");
  const [period, setPeriod] = useState<"MONTHLY" | "YEARLY">(initialPeriod === "YEARLY" ? "YEARLY" : "MONTHLY");
  const [selectedPlanToSwitch, setSelectedPlanToSwitch] = useState<PlanId | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const plans = [
    {
      id: "STARTER" as PlanId,
      name: "Starter",
      tagline: "Essential tools for solo freelancers and independent consultants.",
      price: 9,
      badge: "Freelancer Choice",
      isPopular: false,
      features: [
        "Up to 30 active invoices/month",
        "Unlimited clients & contact address book",
        "Executive PDF generation with corporate styling",
        "Client payment portal with direct pay links",
        "Multi-currency support (USD, EUR, GBP, INR, etc.)",
        "Automatic itemized tax & discount deductions",
        "Custom business logo & invoice prefixing",
        "Standard email support",
      ],
    },
    {
      id: "PRO" as PlanId,
      name: "Pro Studio",
      tagline: "Everything you need to scale invoicing for agencies & studios.",
      price: 15,
      badge: "Most Popular",
      isPopular: true,
      features: [
        "Unlimited invoices & line items (No caps)",
        "Unlimited clients & contacts",
        "Executive PDF layout with payment terms callout & status stamps",
        "Automated overdue tracking & payment reminders",
        "Cash flow & revenue analytics dashboard",
        "One-click financial CSV & ledger exports",
        "Custom invoice sequence & multi-business branding",
        "Priority 24/7 dedicated support & SLA",
        "Early access to Stripe webhooks & automated retainers",
      ],
    },
  ];

  const handleSwitchPlan = async (targetPlan: PlanId) => {
    if (targetPlan === currentPlan) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/subscription", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan, period }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to update subscription." });
      } else {
        setCurrentPlan(targetPlan);
        setSelectedPlanToSwitch(null);
        setMessage({
          type: "success",
          text: `Success! Your workspace is now on the ${data.details.name} plan ($${data.details.price}/month).`,
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const activePlanObj = plans.find((p) => p.id === currentPlan) || plans[0];

  return (
    <div className="space-y-8">
      {/* Plan Status Header Card */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-panel sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              <Sparkles size={13} /> Active Subscription
            </div>
            <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
              {activePlanObj.name} Plan
            </h2>
            <p className="text-sm text-slate-500">
              ${activePlanObj.price}/month • Billed monthly • Next renewal on{" "}
              {new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-line bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs font-semibold text-slate-400">Monthly Allowance</p>
              <p className="text-lg font-black text-ink">
                {currentPlan === "PRO" ? "Unlimited" : "30 Invoices"}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
              <p className="text-xs font-semibold text-emerald-600">Status</p>
              <p className="text-lg font-black text-emerald-700">{initialStatus}</p>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`mt-6 flex items-center gap-3 rounded-2xl p-4 text-sm font-semibold ${
              message.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {message.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}
      </section>

      {/* Plan Selection Cards */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-black text-ink">Change or Upgrade Plan</h3>
          <p className="text-sm text-slate-500">
            Select the tier that matches your business volume and client requirements.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl border transition-all ${
                  isCurrent
                    ? "border-brand-600 bg-brand-50/20 shadow-md ring-2 ring-brand-500/30"
                    : "border-slate-200 bg-white shadow-panel hover:border-slate-300"
                } p-6 sm:p-7`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-3 right-6 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    {plan.badge}
                  </span>
                )}
                {!plan.isPopular && isCurrent && (
                  <span className="absolute -top-3 right-6 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Active Plan
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black text-ink">{plan.name}</h4>
                      <p className="mt-1 text-xs text-slate-500">{plan.tagline}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tight text-ink">${plan.price}</span>
                    <span className="text-sm font-semibold text-slate-400">/ month</span>
                  </div>

                  <div className="my-6 border-t border-slate-100" />

                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    What&apos;s included
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                        <Check size={15} className="mt-0.5 shrink-0 text-brand-600" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  {isCurrent ? (
                    <button
                      disabled
                      className="flex w-full cursor-default items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-100/50 py-3 text-sm font-bold text-brand-800"
                    >
                      <Check size={16} /> Currently Active
                    </button>
                  ) : (
                    <Button
                      onClick={() => setSelectedPlanToSwitch(plan.id)}
                      className="w-full"
                      variant={plan.id === "PRO" ? "primary" : "secondary"}
                    >
                      {plan.id === "PRO" ? (
                        <>
                          <Crown size={16} /> Upgrade to Pro Studio ($15/mo)
                        </>
                      ) : (
                        <>Switch to Starter ($9/mo)</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedPlanToSwitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <CreditCard size={24} />
            </div>

            <h3 className="mt-4 text-xl font-black text-ink">
              Confirm Subscription Update
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              You are switching your workspace subscription to the{" "}
              <b className="text-ink">
                {selectedPlanToSwitch === "PRO" ? "Pro Studio" : "Starter"} Plan
              </b>{" "}
              at{" "}
              <b className="text-ink">
                ${selectedPlanToSwitch === "PRO" ? 15 : 9}/month
              </b>
              .
            </p>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Plan:</span>
                <span className="font-bold">
                  {selectedPlanToSwitch === "PRO" ? "Pro Studio" : "Starter"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Billing Frequency:</span>
                <span className="font-bold">Monthly</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-ink">
                <span>Total Due Now:</span>
                <span>${selectedPlanToSwitch === "PRO" ? "15.00" : "9.00"}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => setSelectedPlanToSwitch(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <Button
                loading={loading}
                onClick={() => handleSwitchPlan(selectedPlanToSwitch)}
              >
                Confirm & Activate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Security & Support Guarantee */}
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-3 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <Shield size={18} className="text-emerald-600 shrink-0" />
          <span>No long-term contracts. Cancel or switch anytime.</span>
        </div>
        <div className="flex items-center gap-3">
          <Zap size={18} className="text-brand-600 shrink-0" />
          <span>Immediate activation across all invoices and exports.</span>
        </div>
        <div className="flex items-center gap-3">
          <RefreshCw size={18} className="text-indigo-600 shrink-0" />
          <span>Prorated billing on plan adjustments.</span>
        </div>
      </div>
    </div>
  );
}
