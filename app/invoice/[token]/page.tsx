import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Download, LockKeyhole, ReceiptText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { effectiveStatus, invoiceTotals, money, formatDate } from "@/lib/utils";
import PublicPayButton from "@/components/PublicPayButton";
import { PrintInvoiceButton } from "@/components/PrintInvoiceButton";
import { StatusPill } from "@/components/ui";

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: token },
    include: { client: true, user: true, lineItems: { orderBy: { createdAt: "asc" } } },
  });

  if (!invoice || invoice.status === "DRAFT") notFound();
  const status = effectiveStatus(invoice);
  const totals = invoiceTotals(invoice);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="no-print mb-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-ink">
            <ReceiptText size={18} className="text-brand-600" /> BillFlow
          </Link>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
            <LockKeyhole size={13} /> Secure invoice link
          </div>
        </div>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-10">
          <header className="flex flex-col justify-between gap-7 border-b border-slate-200 pb-8 sm:flex-row">
            <div className="flex items-center gap-3">
              {invoice.user.logoData ? (
                <img src={invoice.user.logoData} alt="" className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-sm font-black text-white">
                  {invoice.user.businessName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xl font-black">{invoice.user.businessName}</p>
                <p className="text-xs text-slate-400">Invoice {invoice.number}</p>
              </div>
            </div>
            <div className="sm:text-right">
              <StatusPill status={status} />
              <p className="mt-3 text-xs text-slate-400">Due {formatDate(invoice.dueDate)}</p>
            </div>
          </header>

          <div className="grid gap-7 border-b border-slate-200 py-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bill to</p>
              <p className="mt-2 font-black">{invoice.client.name}</p>
              <p className="mt-1 text-sm text-slate-500">{invoice.client.company}</p>
              <p className="mt-1 text-sm text-slate-500">{invoice.client.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Issue date</p>
              <p className="mt-2 font-bold">{formatDate(invoice.issueDate)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Due date</p>
              <p className={`mt-2 font-bold ${status === "overdue" ? "text-rose-600" : ""}`}>{formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          <div className="overflow-x-auto py-7">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 text-left">Description</th>
                  <th className="py-3 text-right">Qty</th>
                  <th className="py-3 text-right">Rate</th>
                  <th className="py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 pr-4 font-medium">{item.description}</td>
                    <td className="py-4 text-right text-slate-500">{Number(item.quantity)}</td>
                    <td className="py-4 text-right text-slate-500">{money(item.rate.toString(), invoice.user.currency)}</td>
                    <td className="py-4 text-right font-bold">
                      {money(Number(item.quantity) * Number(item.rate), invoice.user.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>{money(totals.subtotal, invoice.user.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Discount</span>
                <span>-{money(totals.discount, invoice.user.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tax</span>
                <span>{money(totals.tax, invoice.user.currency)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-slate-200 pt-4 text-lg">
                <span className="font-black">Total</span>
                <span className="font-black">{money(totals.total, invoice.user.currency)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-8 rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Notes</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{invoice.notes}</p>
            </div>
          )}

          <div className="no-print mt-9">
            {status === "paid" ? (
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
                <CheckCircle2 size={20} /> This invoice has been paid.
              </div>
            ) : (
              <PublicPayButton token={token} status={status} />
            )}
          </div>

          <div className="no-print mt-7 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
            <a
              href={`/api/public/invoices/${token}/pdf`}
              download
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
            >
              <Download size={16} /> Download Official PDF
            </a>
            <PrintInvoiceButton />
          </div>
        </article>

        <p className="no-print mt-5 text-center text-xs text-slate-400">
          Payments are simulated in demo mode. Powered by BillFlow.
        </p>
      </div>
    </main>
  );
}

