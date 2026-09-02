import Link from "next/link";
import { ArrowUpRight, CircleAlert, FilePlus2, Plus, WalletCards, Users, Rocket } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveStatus, invoiceTotals, money, formatDate } from "@/lib/utils";
import { StatusPill, EmptyState, Button } from "@/components/ui";
import { IncomeChart } from "@/components/Chart";

export default async function DashboardPage() {
  const user = await requireUser();
  const [invoices, recent, clientCount] = await Promise.all([
    prisma.invoice.findMany({ where: { userId: user.id }, include: { lineItems: true }, orderBy: { issueDate: "desc" } }),
    prisma.invoice.findMany({ where: { userId: user.id }, include: { client: true, lineItems: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.client.count({ where: { userId: user.id } }),
  ]);

  const enriched = invoices.map((invoice) => ({
    ...invoice,
    status: effectiveStatus(invoice),
    totals: invoiceTotals(invoice),
  }));

  const earned = enriched.filter((x) => x.status === "paid").reduce((s, x) => s + x.totals.total, 0);
  const outstanding = enriched.filter((x) => x.status === "sent" || x.status === "overdue").reduce((s, x) => s + x.totals.total, 0);
  const overdue = enriched.filter((x) => x.status === "overdue").reduce((s, x) => s + x.totals.total, 0);
  const overdueCount = enriched.filter((x) => x.status === "overdue").length;

  const monthBuckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString("en-US", { month: "short" }), income: 0 };
  });
  enriched.filter((x) => x.status === "paid").forEach((x) => {
    const d = new Date(x.paidAt || x.issueDate);
    const b = monthBuckets.find((m) => m.year === d.getFullYear() && m.month === d.getMonth());
    if (b) b.income += x.totals.total;
  });

  const isNewUser = invoices.length === 0 && clientCount === 0;
  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-7">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            {isNewUser ? `Welcome, ${firstName}! 🎉` : `Good to see you, ${firstName}.`}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            {isNewUser ? "Let's get started." : "Your money, at a glance."}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isNewUser
              ? "Add your first client, then create an invoice to see your dashboard come alive."
              : "A clear view of what is earned, due and overdue."}
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus size={17} /> New invoice
          </Button>
        </Link>
      </div>

      {/* New user onboarding checklist */}
      {isNewUser && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-6">
          <div className="flex items-center gap-3">
            <Rocket size={22} className="text-indigo-600" />
            <h2 className="font-black text-indigo-900">Quick start — 2 steps to your first invoice</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href="/clients/new"
              className="group flex items-center gap-4 rounded-xl border border-indigo-100 bg-white px-4 py-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white text-sm font-black">1</span>
              <div>
                <p className="font-bold text-slate-800 group-hover:text-indigo-700">Add a client</p>
                <p className="text-xs text-slate-500 mt-0.5">Name, email, company — takes 30 seconds.</p>
              </div>
              <Users size={18} className="ml-auto text-slate-300 group-hover:text-indigo-400" />
            </Link>
            <Link
              href="/invoices/new"
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600 text-sm font-black">2</span>
              <div>
                <p className="font-bold text-slate-800 group-hover:text-indigo-700">Create an invoice</p>
                <p className="text-xs text-slate-500 mt-0.5">Line items, taxes, due dates — all in one form.</p>
              </div>
              <FilePlus2 size={18} className="ml-auto text-slate-300 group-hover:text-indigo-400" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={<WalletCards size={19} />} label="Total earned" value={money(earned, user.currency)} note="Paid invoices" />
        <Metric icon={<ArrowUpRight size={19} />} label="Outstanding" value={money(outstanding, user.currency)} note="Sent & unpaid" />
        <Metric
          icon={<CircleAlert size={19} />}
          label="Overdue"
          value={money(overdue, user.currency)}
          note={`${overdueCount} invoice${overdueCount === 1 ? "" : "s"}`}
          danger
        />
      </div>

      {/* Charts + Recent */}
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-black">Income over time</h2>
              <p className="mt-1 text-xs text-slate-400">Paid invoices, last 6 months</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
              Lifetime paid
            </span>
          </div>
          <div className="mt-5">
            <IncomeChart data={monthBuckets.map(({ label, income }) => ({ month: label, income }))} currency={user.currency} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black">Recent invoices</h2>
              <p className="mt-1 text-xs text-slate-400">Latest activity</p>
            </div>
            <Link href="/invoices" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
              View all
            </Link>
          </div>
          {recent.length ? (
            <div className="mt-4 divide-y divide-slate-100">
              {recent.map((inv) => {
                const status = effectiveStatus(inv);
                const totals = invoiceTotals(inv);
                return (
                  <Link key={inv.id} href={`/invoices/${inv.id}`} className="block py-3 first:pt-1 hover:opacity-80">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{inv.number}</p>
                        <p className="truncate text-xs text-slate-400">{inv.client.company || inv.client.name}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black">{money(totals.total, user.currency)}</p>
                        <StatusPill status={status} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-12">
              <EmptyState
                title="No invoices yet"
                description="Create your first invoice and your dashboard will start filling in."
                action={
                  <Link href="/invoices/new">
                    <Button size="sm">
                      <FilePlus2 size={16} /> Create invoice
                    </Button>
                  </Link>
                }
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  note,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            danger ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600"
          }`}
        >
          {icon}
        </div>
        <span className="text-xs font-medium text-slate-400">{note}</span>
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
}
