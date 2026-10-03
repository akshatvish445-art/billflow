import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Landmark, QrCode, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveStatus, invoiceTotals, money, formatDate } from "@/lib/utils";
import InvoiceActions from "@/components/InvoiceActions";
import { StatusPill } from "@/components/ui";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: user.id },
    include: {
      client: true,
      lineItems: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!invoice) notFound();

  const status = effectiveStatus(invoice);
  const totals = invoiceTotals(invoice);
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invoice/${invoice.publicToken}`;

  const isGst = Boolean(invoice.isGstInvoice || user.isGstRegistered);
  const isIntraState = Number(invoice.cgstAmount) > 0 || Number(invoice.sgstAmount) > 0;

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation & Actions */}
      <div className="no-print flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-ink transition"
          >
            <ArrowLeft size={16} /> Back to invoices
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-black text-ink">{invoice.number}</h1>
            <StatusPill status={status} />
            {isGst && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                <ShieldCheck size={12} /> GST Tax Invoice
              </span>
            )}
          </div>
        </div>
        <InvoiceActions invoiceId={invoice.id} publicUrl={publicUrl} status={status} />
      </div>

      {/* Invoice Document Card */}
      <article className="print-page mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-10">
        {/* Header */}
        <header className="flex flex-col justify-between gap-7 border-b border-slate-200 pb-8 sm:flex-row sm:items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {user.logoData ? (
                <img
                  src={user.logoData}
                  alt="Business logo"
                  className="h-14 w-14 rounded-2xl object-cover border border-slate-100"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-base font-black text-white shadow-sm">
                  {user.businessName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-2xl font-black text-ink">{user.businessName}</p>
                <p className="text-xs font-semibold text-slate-400">
                  {isGst ? "Registered GST Organization" : "Commercial Billing Workspace"}
                </p>
              </div>
            </div>

            {/* Seller Organization GST Details */}
            {isGst && (user.gstin || user.businessAddress) && (
              <div className="rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600 space-y-1">
                {user.businessAddress && <p>{user.businessAddress}</p>}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 font-medium">
                  {user.gstin && (
                    <span>
                      <strong className="text-slate-900">GSTIN:</strong> {user.gstin}
                    </span>
                  )}
                  {user.pan && (
                    <span>
                      <strong className="text-slate-900">PAN:</strong> {user.pan}
                    </span>
                  )}
                  {user.state && (
                    <span>
                      <strong className="text-slate-900">State:</strong> {user.state}{" "}
                      {user.stateCode ? `(${user.stateCode})` : ""}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-brand-600">
              {isGst ? "TAX INVOICE" : "INVOICE"}
            </p>
            <p className="mt-1 text-2xl font-black text-ink">{invoice.number}</p>
            <div className="mt-2.5">
              <StatusPill status={status} />
            </div>
            {invoice.placeOfSupply && (
              <p className="mt-2 text-xs text-slate-500">
                <strong>Place of Supply:</strong> {invoice.placeOfSupply}
              </p>
            )}
          </div>
        </header>

        {/* Bill To & Date Metadata */}
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
            {invoice.client.phone && <p className="text-xs text-slate-500">{invoice.client.phone}</p>}

            {/* Client GST Details */}
            {invoice.client.gstin && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
                <span>GSTIN: {invoice.client.gstin}</span>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Issue Date</p>
            <p className="mt-2 text-sm font-bold text-ink">{formatDate(invoice.issueDate)}</p>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">Payment Terms</p>
            <p className="mt-1 text-xs text-slate-600">Due within 14 days of receipt</p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Due Date</p>
            <p
              className={`mt-2 text-sm font-bold ${
                status === "overdue" ? "text-rose-600" : "text-ink"
              }`}
            >
              {formatDate(invoice.dueDate)}
            </p>
            {isGst && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Supply Type</p>
                <p className="mt-1 text-xs font-semibold text-slate-700">
                  {isIntraState ? "Intra-State (CGST + SGST)" : "Inter-State (IGST)"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto py-7">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 pr-4">Description</th>
                {isGst && <th className="py-3 px-3">HSN/SAC</th>}
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
                    <td className="py-4 px-3 font-mono text-xs text-slate-600">
                      {item.hsnSac || "—"}
                    </td>
                  )}
                  <td className="py-4 text-right text-slate-500">{Number(item.quantity)}</td>
                  <td className="py-4 text-right text-slate-500">
                    {money(Number(item.rate), user.currency)}
                  </td>
                  {isGst && (
                    <td className="py-4 text-right text-xs font-semibold text-slate-600">
                      {Number(item.gstRate ?? 18)}%
                    </td>
                  )}
                  <td className="py-4 text-right font-bold text-ink">
                    {money(Number(item.quantity) * Number(item.rate), user.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="flex justify-end border-t border-slate-100 pt-6">
          <div className="w-full max-w-sm space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Taxable Subtotal</span>
              <span className="font-semibold text-slate-800">{money(totals.subtotal, user.currency)}</span>
            </div>

            {totals.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Discount ({Number(invoice.discountRate)}%)</span>
                <span className="font-semibold text-emerald-600">
                  -{money(totals.discount, user.currency)}
                </span>
              </div>
            )}

            {isGst ? (
              isIntraState ? (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Central Tax (CGST)</span>
                    <span className="font-semibold text-slate-800">
                      {money(Number(invoice.cgstAmount), user.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">State Tax (SGST)</span>
                    <span className="font-semibold text-slate-800">
                      {money(Number(invoice.sgstAmount), user.currency)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Integrated Tax (IGST)</span>
                  <span className="font-semibold text-slate-800">
                    {money(Number(invoice.igstAmount), user.currency)}
                  </span>
                </div>
              )
            ) : (
              <div className="flex justify-between">
                <span className="text-slate-500">Tax ({Number(invoice.taxRate)}%)</span>
                <span className="font-semibold text-slate-800">{money(totals.tax, user.currency)}</span>
              </div>
            )}

            <div className="mt-3 flex justify-between border-t border-slate-200 pt-4 text-lg">
              <span className="font-black text-ink">Total Due</span>
              <span className="font-black text-ink">{money(totals.total, user.currency)}</span>
            </div>
          </div>
        </div>

        {/* Bank & Settlement Details (For Wire Transfer) */}
        {(user.bankName || user.bankAccountNo || user.upiId) && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Landmark size={15} className="text-brand-600" /> Bank & Wire Settlement Details
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs text-slate-600">
              {user.bankName && (
                <div>
                  <span className="text-slate-400">Bank: </span>
                  <strong className="text-slate-900">{user.bankName}</strong>
                </div>
              )}
              {user.bankAccountNo && (
                <div>
                  <span className="text-slate-400">Account No: </span>
                  <strong className="font-mono text-slate-900">{user.bankAccountNo}</strong>
                </div>
              )}
              {user.bankIfsc && (
                <div>
                  <span className="text-slate-400">IFSC Code: </span>
                  <strong className="font-mono text-slate-900">{user.bankIfsc}</strong>
                </div>
              )}
              {user.bankBranch && (
                <div>
                  <span className="text-slate-400">Branch: </span>
                  <strong className="text-slate-900">{user.bankBranch}</strong>
                </div>
              )}
              {user.upiId && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400">UPI VPA: </span>
                  <strong className="font-mono text-brand-700">{user.upiId}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Notes & Terms</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{invoice.notes}</p>
          </div>
        )}

        <footer className="mt-10 border-t border-slate-100 pt-6 text-xs text-slate-400">
          This is a computer-generated {isGst ? "Tax Invoice under Indian GST Law" : "commercial invoice"}. No signature required.
        </footer>
      </article>
    </div>
  );
}
