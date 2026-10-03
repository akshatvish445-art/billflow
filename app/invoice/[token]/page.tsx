import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Download,
  Landmark,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { effectiveStatus, invoiceTotals, money, formatDate } from "@/lib/utils";
import PublicPayButton from "@/components/PublicPayButton";
import { PrintInvoiceButton } from "@/components/PrintInvoiceButton";
import { StatusPill } from "@/components/ui";

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: token },
    include: {
      client: true,
      user: true,
      lineItems: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!invoice || invoice.status === "DRAFT") notFound();

  const status = effectiveStatus(invoice);
  const totals = invoiceTotals(invoice);

  const isGst = Boolean(invoice.isGstInvoice || invoice.user.isGstRegistered);
  const isIntraState = Number(invoice.cgstAmount) > 0 || Number(invoice.sgstAmount) > 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="no-print mb-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-ink">
            <ReceiptText size={18} className="text-brand-600" /> BillFlow
          </Link>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
            <LockKeyhole size={13} /> Secure Verified Payment Link
          </div>
        </div>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-10">
          {/* Header */}
          <header className="flex flex-col justify-between gap-7 border-b border-slate-200 pb-8 sm:flex-row sm:items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {invoice.user.logoData ? (
                  <img
                    src={invoice.user.logoData}
                    alt=""
                    className="h-14 w-14 rounded-2xl object-cover border border-slate-100"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-sm font-black text-white">
                    {invoice.user.businessName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-2xl font-black text-ink">{invoice.user.businessName}</p>
                  <p className="text-xs font-semibold text-slate-400">
                    {isGst ? "Registered GST Supplier" : "Commercial Workspace"}
                  </p>
                </div>
              </div>

              {/* Organization GST details */}
              {isGst && (invoice.user.gstin || invoice.user.businessAddress) && (
                <div className="rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600 space-y-1">
                  {invoice.user.businessAddress && <p>{invoice.user.businessAddress}</p>}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 font-medium">
                    {invoice.user.gstin && (
                      <span>
                        <strong className="text-slate-900">GSTIN:</strong> {invoice.user.gstin}
                      </span>
                    )}
                    {invoice.user.pan && (
                      <span>
                        <strong className="text-slate-900">PAN:</strong> {invoice.user.pan}
                      </span>
                    )}
                    {invoice.user.state && (
                      <span>
                        <strong className="text-slate-900">State:</strong> {invoice.user.state}{" "}
                        {invoice.user.stateCode ? `(${invoice.user.stateCode})` : ""}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-brand-600">
                {isGst ? "TAX INVOICE" : "INVOICE"}
              </p>
              <p className="mt-1 text-2xl font-black text-ink">{invoice.number}</p>
              <div className="mt-2.5">
                <StatusPill status={status} />
              </div>
              <p className="mt-3 text-xs text-slate-400">Due {formatDate(invoice.dueDate)}</p>
              {invoice.placeOfSupply && (
                <p className="mt-1 text-xs text-slate-500">
                  <strong>Place of Supply:</strong> {invoice.placeOfSupply}
                </p>
              )}
            </div>
          </header>

          {/* Bill To & Issue Date */}
          <div className="grid gap-7 border-b border-slate-200 py-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Billed To (Buyer)</p>
              <p className="mt-2 text-base font-black text-ink">{invoice.client.name}</p>
              {invoice.client.company && (
                <p className="text-sm font-semibold text-slate-700">{invoice.client.company}</p>
              )}
              {invoice.client.address && (
                <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-500">
                  {invoice.client.address}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">{invoice.client.email}</p>
              {invoice.client.gstin && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
                  <span>Buyer GSTIN: {invoice.client.gstin}</span>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Issue Date</p>
              <p className="mt-2 font-bold text-ink">{formatDate(invoice.issueDate)}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Due Date</p>
              <p className={`mt-2 font-bold ${status === "overdue" ? "text-rose-600" : "text-ink"}`}>
                {formatDate(invoice.dueDate)}
              </p>
              {isGst && (
                <p className="mt-3 text-xs text-slate-500">
                  {isIntraState ? "Intra-State Supply (CGST + SGST)" : "Inter-State Supply (IGST)"}
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto py-7">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 text-left">Description</th>
                  {isGst && <th className="py-3 px-3 text-left">HSN/SAC</th>}
                  <th className="py-3 text-right">Qty</th>
                  <th className="py-3 text-right">Rate</th>
                  {isGst && <th className="py-3 text-right">GST %</th>}
                  <th className="py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 pr-4 font-medium text-ink">{item.description}</td>
                    {isGst && (
                      <td className="py-4 px-3 font-mono text-xs text-slate-500">
                        {item.hsnSac || "—"}
                      </td>
                    )}
                    <td className="py-4 text-right text-slate-500">{Number(item.quantity)}</td>
                    <td className="py-4 text-right text-slate-500">
                      {money(item.rate.toString(), invoice.user.currency)}
                    </td>
                    {isGst && (
                      <td className="py-4 text-right text-xs font-semibold text-slate-600">
                        {Number(item.gstRate ?? 18)}%
                      </td>
                    )}
                    <td className="py-4 text-right font-bold text-ink">
                      {money(Number(item.quantity) * Number(item.rate), invoice.user.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end border-t border-slate-100 pt-6">
            <div className="w-full max-w-sm space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Taxable Subtotal</span>
                <span className="font-semibold text-slate-800">{money(totals.subtotal, invoice.user.currency)}</span>
              </div>

              {totals.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Discount ({Number(invoice.discountRate)}%)</span>
                  <span className="font-semibold text-emerald-600">
                    -{money(totals.discount, invoice.user.currency)}
                  </span>
                </div>
              )}

              {isGst ? (
                isIntraState ? (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Central Tax (CGST)</span>
                      <span className="font-semibold text-slate-800">
                        {money(Number(invoice.cgstAmount), invoice.user.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">State Tax (SGST)</span>
                      <span className="font-semibold text-slate-800">
                        {money(Number(invoice.sgstAmount), invoice.user.currency)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Integrated Tax (IGST)</span>
                    <span className="font-semibold text-slate-800">
                      {money(Number(invoice.igstAmount), invoice.user.currency)}
                    </span>
                  </div>
                )
              ) : (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax ({Number(invoice.taxRate)}%)</span>
                  <span className="font-semibold text-slate-800">{money(totals.tax, invoice.user.currency)}</span>
                </div>
              )}

              <div className="mt-3 flex justify-between border-t border-slate-200 pt-4 text-lg">
                <span className="font-black text-ink">Total Due</span>
                <span className="font-black text-ink">{money(totals.total, invoice.user.currency)}</span>
              </div>
            </div>
          </div>

          {/* Wire Settlement Details */}
          {(invoice.user.bankName || invoice.user.bankAccountNo || invoice.user.upiId) && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Landmark size={15} className="text-brand-600" /> Bank & Wire Settlement Details
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs text-slate-600">
                {invoice.user.bankName && (
                  <div>
                    <span className="text-slate-400">Bank: </span>
                    <strong className="text-slate-900">{invoice.user.bankName}</strong>
                  </div>
                )}
                {invoice.user.bankAccountNo && (
                  <div>
                    <span className="text-slate-400">Account No: </span>
                    <strong className="font-mono text-slate-900">{invoice.user.bankAccountNo}</strong>
                  </div>
                )}
                {invoice.user.bankIfsc && (
                  <div>
                    <span className="text-slate-400">IFSC Code: </span>
                    <strong className="font-mono text-slate-900">{invoice.user.bankIfsc}</strong>
                  </div>
                )}
                {invoice.user.upiId && (
                  <div>
                    <span className="text-slate-400">UPI VPA: </span>
                    <strong className="font-mono text-brand-700">{invoice.user.upiId}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {invoice.notes && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Notes & Terms</p>
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
          Powered by BillFlow • Secure GST & Commercial Billing System
        </p>
      </div>
    </main>
  );
}
