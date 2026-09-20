import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Clock3,
  CreditCard,
  Crown,
  Download,
  FileCheck2,
  FileText,
  HelpCircle,
  Link2,
  Lock,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { PublicNav } from "@/components/PublicNav";

const features = [
  {
    icon: FileText,
    title: "Executive PDF Invoices",
    description: "Generate publication-grade PDF invoices with corporate headers, status stamps, and precise alignment.",
  },
  {
    icon: Link2,
    title: "One-Click Client Links",
    description: "Share live invoice portals where clients can review, download official PDFs, and simulate instant settlement.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Cash Intelligence",
    description: "Track collected revenue, pending receivables, and overdue invoices across all your accounts.",
  },
  {
    icon: Zap,
    title: "Smart Tax & Multi-Currency",
    description: "Handles GST, VAT, discounts, and currencies including USD, EUR, GBP, INR, AED, CAD, and AUD effortlessly.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Workspace",
    description: "Built with secure tokenized public links, bcrypt password hashing, and encrypted database storage.",
  },
  {
    icon: Clock3,
    title: "Overdue Reminders",
    description: "Stay ahead of late payers with automated status tracking and fast payment link sharing.",
  },
];

const faqs = [
  {
    q: "Can I switch between the $9 and $15 plans anytime?",
    a: "Yes. You can upgrade, downgrade, or switch plans at any moment from your workspace settings with immediate activation.",
  },
  {
    q: "How does the executive PDF formatting look?",
    a: "Every invoice PDF is vector-rendered with crisp typography, distinctive status stamps (PAID, OVERDUE, SENT), itemized line tables, and payment instructions.",
  },
  {
    q: "Do my clients need an account to view or pay?",
    a: "No! Clients receive a clean, secure link that opens directly on desktop or mobile. They can inspect the line items, download the official PDF, and complete payment.",
  },
  {
    q: "What payment methods and currencies are supported?",
    a: "BillFlow supports all major world currencies including USD, EUR, GBP, INR, AUD, CAD, SGD, AED, and JPY with localized currency formatting.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white selection:bg-brand-100 selection:text-brand-900">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[780px] bg-[radial-gradient(circle_at_25%_12%,rgba(99,102,241,.18),transparent_38%),radial-gradient(circle_at_80%_8%,rgba(14,165,233,.14),transparent_32%)]" />

      <PublicNav />

      {/* Hero Section */}
      <section className="mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:pt-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-700 shadow-sm">
            <Sparkles size={14} className="text-brand-600 animate-pulse" /> Commercial Invoicing for Modern Teams
          </div>

          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.05] tracking-[-0.04em] text-ink sm:text-6xl">
            Invoices that look <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">executive</span> and get paid on time.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            BillFlow elevates your business with publication-grade PDF invoices, shareable client portals, and real-time cash flow visibility. Built for independent creators, freelancers, and growing studios.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-900/15 transition hover:bg-slate-800 hover:shadow-slate-900/25 active:scale-[0.98]"
            >
              Start Free Trial <ArrowRight size={16} />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
            >
              View Pricing ($9 & $15/mo)
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-6 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-2">
              <Check size={16} className="text-emerald-600" /> No credit card required to start
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" /> Bank-grade security
            </span>
            <span className="inline-flex items-center gap-2">
              <Zap size={16} className="text-emerald-600" /> 60-second setup
            </span>
          </div>
        </div>

        {/* Invoice Preview Card */}
        <div className="relative animate-float">
          <div className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-tr from-brand-200/50 to-indigo-200/40 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-2xl sm:p-8">
            {/* Mock Header */}
            <div className="flex items-center justify-between border-b border-line pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-xs font-black text-white">
                  NS
                </div>
                <div>
                  <p className="text-base font-black text-ink">Northstar Studio</p>
                  <p className="text-xs text-slate-400">Invoice #NST-1002</p>
                </div>
              </div>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                Awaiting Payment
              </span>
            </div>

            {/* Bill to & particulars */}
            <div className="grid grid-cols-2 gap-5 py-5 text-xs">
              <div>
                <p className="font-bold uppercase tracking-wider text-slate-400">Billed to</p>
                <p className="mt-1 text-sm font-bold text-ink">Vertex Labs Corp</p>
                <p className="text-slate-500">billing@vertexlabs.io</p>
              </div>
              <div className="text-right">
                <p className="font-bold uppercase tracking-wider text-slate-400">Due Date</p>
                <p className="mt-1 text-sm font-bold text-ink">Sep 24, 2026</p>
                <p className="text-slate-500">Terms: Net 10 Days</p>
              </div>
            </div>

            {/* Line items preview */}
            <div className="space-y-2.5 border-t border-line py-4">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">Full-Stack Application Sprint</span>
                <b className="text-ink">$4,500.00</b>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">Cloud Infrastructure & QA</span>
                <b className="text-ink">$1,200.00</b>
              </div>
            </div>

            {/* Totals Box */}
            <div className="rounded-2xl bg-slate-50 p-4 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>$5,700.00</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Discount (5%)</span>
                <span className="text-rose-600">-$285.00</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax (10%)</span>
                <span>$541.50</span>
              </div>
              <div className="flex justify-between border-t border-line pt-2.5 text-sm font-black text-ink">
                <span>Total Due</span>
                <span className="text-base text-brand-600">$5,956.50</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2.5">
              <span className="flex-1 rounded-xl bg-ink py-2.5 text-center text-xs font-bold text-white shadow-sm">
                Pay Now ($5,956.50)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-white">
                <Download size={14} /> Official PDF
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y border-slate-100 bg-slate-50/50 py-8">
        <div className="mx-auto max-w-7xl px-5 text-center sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
            Trusted by over 1,500+ independent studios, agencies & freelancers worldwide
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="border-b border-slate-200 bg-slate-50/70 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Built for commercial execution
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Everything required to run professional billing.
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Streamline your accounts receivable from first draft to final payment without bloated complexity.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="rounded-3xl border border-slate-200 bg-white p-7 shadow-panel transition hover:border-slate-300 hover:shadow-soft"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-5 text-lg font-black text-ink">{feat.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section (The core $9 and $15 packages) */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-700">
              <CreditCard size={14} /> Clear, Predictable Plans
            </div>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-ink sm:text-5xl">
              Two simple tiers. Zero hidden fees.
            </h2>
            <p className="mt-3 text-base text-slate-500">
              Choose the right subscription for your volume. Upgrade, downgrade, or cancel anytime.
            </p>
          </div>

          {/* Pricing Cards Container */}
          <div className="mt-16 grid gap-8 max-w-5xl mx-auto lg:grid-cols-2 lg:items-stretch">
            {/* Starter Plan - $9/month */}
            <div className="relative flex flex-col justify-between rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-panel transition hover:shadow-soft sm:p-10">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      Solo & Freelance
                    </span>
                    <h3 className="mt-4 text-2xl font-black text-ink">Starter Plan</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Essential tools for independent contractors & solo freelancers.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-5xl font-black tracking-tight text-ink">$9</span>
                  <span className="text-sm font-semibold text-slate-400">/ month</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Billed monthly, cancel anytime</p>

                <div className="my-8 border-t border-slate-100" />

                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Included in Starter:
                </p>
                <ul className="mt-4 space-y-3">
                  {[
                    "Up to 30 active invoices / month",
                    "Unlimited client accounts & contact records",
                    "Executive vector PDF invoice downloads",
                    "Shareable client portal with direct pay links",
                    "Multi-currency support (USD, EUR, GBP, INR, etc.)",
                    "Automated tax & discount calculations",
                    "Custom business logo & invoice prefixing",
                    "Standard email customer support",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs font-medium text-slate-700">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10 pt-4">
                <Link
                  href="/signup"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-ink shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
                >
                  Get Started with Starter ($9/mo)
                </Link>
              </div>
            </div>

            {/* Pro Studio Plan - $15/month (Featured / Most Popular) */}
            <div className="relative flex flex-col justify-between rounded-[2.5rem] border-2 border-brand-600 bg-gradient-to-b from-white to-brand-50/20 p-8 shadow-2xl ring-4 ring-brand-500/15 sm:p-10">
              <span className="absolute -top-4 right-8 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 px-4 py-1.5 text-xs font-extrabold text-white shadow-md">
                <Crown size={14} /> Most Popular
              </span>

              <div>
                <div>
                  <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-800">
                    Studios & Agencies
                  </span>
                  <h3 className="mt-4 text-2xl font-black text-ink">Pro Studio</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    High-volume invoicing, advanced analytics & dedicated SLA for businesses.
                  </p>
                </div>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-5xl font-black tracking-tight text-ink">$15</span>
                  <span className="text-sm font-semibold text-slate-400">/ month</span>
                </div>
                <p className="mt-1 text-xs text-brand-600 font-semibold">Best value for scaling businesses</p>

                <div className="my-8 border-t border-slate-200" />

                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Everything in Starter, plus:
                </p>
                <ul className="mt-4 space-y-3">
                  {[
                    "Unlimited invoices & line items (No volume caps)",
                    "Unlimited client accounts & contacts",
                    "Executive PDF styling with payment terms callouts & status stamps",
                    "Automated overdue tracking & late payment reminders",
                    "Comprehensive cash flow & revenue analytics reports",
                    "One-click CSV ledger & financial report export",
                    "Custom numbering sequences & multi-business setups",
                    "Priority 24/7 dedicated support & rapid SLA",
                    "Early access to automated retainers & Stripe webhooks",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs font-medium text-slate-800">
                      <Check size={16} className="mt-0.5 shrink-0 text-brand-600" />
                      <span className="font-semibold">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10 pt-4">
                <Link
                  href="/signup"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-700 active:scale-[0.98]"
                >
                  <Crown size={16} /> Start Pro Studio ($15/mo)
                </Link>
              </div>
            </div>
          </div>

          {/* Guarantee Pill */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">
              <Check size={15} className="text-emerald-600" /> 14-day free trial on all plans
            </span>
            <span className="inline-flex items-center gap-2">
              <Lock size={15} className="text-indigo-600" /> Encrypted billing via Stripe / bank card
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={15} className="text-emerald-600" /> Cancel anytime with 1-click
            </span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-slate-200 bg-slate-50/70 py-20">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div className="text-center">
            <HelpCircle size={24} className="mx-auto text-brand-600" />
            <h2 className="mt-3 text-3xl font-black tracking-tight text-ink">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Clear answers about BillFlow subscriptions, PDF generation, and payment workflows.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-ink text-sm">{faq.q}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Conversion CTA */}
      <section className="mx-auto max-w-7xl px-5 py-20 text-center sm:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-6 py-14 text-white sm:px-12 sm:py-16 shadow-2xl">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,.3),transparent_50%)]" />
          <Clock3 size={28} className="mx-auto text-brand-400" />
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            Upgrade your invoicing workflow today.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
            Join thousands of studios and contractors creating beautiful invoices that get funded without delay.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-500 active:scale-[0.98]"
            >
              Create Your Workspace <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-700"
            >
              Sign In to Existing Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-black text-ink">
            <ReceiptText size={18} className="text-brand-600" /> BillFlow Workspace
          </div>
          <p>© {new Date().getFullYear()} BillFlow. Commercial invoicing built for real-world products.</p>
          <div className="flex gap-4 font-semibold text-slate-500">
            <a href="#pricing" className="hover:text-ink">Pricing</a>
            <a href="#features" className="hover:text-ink">Features</a>
            <Link href="/login" className="hover:text-ink">Sign In</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
