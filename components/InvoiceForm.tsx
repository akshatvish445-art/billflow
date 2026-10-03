"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Calculator,
  Copy,
  FileCheck2,
  Percent,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Field } from "@/components/ui";
import { money } from "@/lib/utils";
import { GST_RATES, INDIAN_STATES, calculateGstBreakdown } from "@/lib/gst";

type Item = {
  description: string;
  quantity: number;
  rate: number;
  hsnSac?: string;
  gstRate?: number;
};

interface UserProps {
  isGstRegistered?: boolean;
  state?: string | null;
  stateCode?: string | null;
  gstin?: string | null;
  plan?: string;
}

export default function InvoiceForm({
  clients,
  currency,
  initial,
  user,
}: {
  mode: "create";
  clients: any[];
  currency: string;
  initial?: any;
  user?: UserProps;
}) {
  const router = useRouter();

  const [clientId, setClientId] = useState(initial?.clientId || clients[0]?.id || "");
  const [issueDate, setIssueDate] = useState(
    initial ? new Date(initial.issueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState(
    initial
      ? new Date(initial.dueDate).toISOString().slice(0, 10)
      : new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );

  const [isGstInvoice, setIsGstInvoice] = useState(
    initial?.isGstInvoice !== undefined ? Boolean(initial.isGstInvoice) : Boolean(user?.isGstRegistered)
  );

  const selectedClient = clients.find((c) => c.id === clientId) || clients[0];

  const defaultPos =
    selectedClient?.stateCode
      ? `${selectedClient.stateCode} - ${selectedClient.state || ""}`
      : selectedClient?.state || (user?.stateCode ? `${user.stateCode} - ${user.state || ""}` : "");

  const [placeOfSupply, setPlaceOfSupply] = useState(initial?.placeOfSupply || defaultPos);
  const [taxRate, setTaxRate] = useState(Number(initial?.taxRate || 18));
  const [discountRate, setDiscountRate] = useState(Number(initial?.discountRate || 0));
  const [notes, setNotes] = useState(initial?.notes || "");

  const [items, setItems] = useState<Item[]>(
    initial?.lineItems?.map((i: any) => ({
      description: i.description,
      quantity: Number(i.quantity),
      rate: Number(i.rate),
      hsnSac: i.hsnSac || "",
      gstRate: Number(i.gstRate || 18),
    })) || [
      {
        description: "",
        quantity: 1,
        rate: 0,
        hsnSac: isGstInvoice ? "998311" : "",
        gstRate: 18,
      },
    ]
  );

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // When client changes, auto-update place of supply
  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    const cli = clients.find((c) => c.id === newClientId);
    if (cli) {
      if (cli.stateCode) {
        setPlaceOfSupply(`${cli.stateCode} - ${cli.state || ""}`);
      } else if (cli.state) {
        setPlaceOfSupply(cli.state);
      }
    }
  };

  // Derive client state code from place of supply or client object
  const clientStateCode = useMemo(() => {
    if (selectedClient?.stateCode) return selectedClient.stateCode;
    const match = placeOfSupply.match(/^([0-9]{2})/);
    return match ? match[1] : undefined;
  }, [selectedClient, placeOfSupply]);

  // Compute live breakdown
  const totals = useMemo(() => {
    return calculateGstBreakdown({
      items,
      discountRate,
      overallTaxRate: taxRate,
      isGstInvoice,
      supplierStateCode: user?.stateCode,
      clientStateCode,
    });
  }, [items, discountRate, taxRate, isGstInvoice, user?.stateCode, clientStateCode]);

  const setItem = (idx: number, patch: Partial<Item>) =>
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const clean = items.filter((i) => i.description.trim() && i.rate >= 0 && i.quantity > 0);
    if (!clientId || clean.length === 0) {
      setError("Please choose a client and specify at least one valid line item.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          issueDate,
          dueDate,
          taxRate,
          discountRate,
          notes,
          isGstInvoice,
          placeOfSupply,
          items: clean,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create invoice");
        setSaving(false);
        return;
      }

      router.push(`/invoices/${data.invoice.id}`);
      router.refresh();
    } catch {
      setError("Failed to create invoice. Please check your connection.");
      setSaving(false);
    }
  };

  if (!clients.length) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link href="/clients" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
          <ArrowLeft size={16} /> Back to clients
        </Link>
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-panel">
          <h1 className="text-2xl font-black">Add a client first</h1>
          <p className="mt-2 text-sm text-slate-500">
            An invoice needs a billing contact and tax jurisdiction. Add your first client, then return here.
          </p>
          <Link href="/clients" className="mt-5 inline-flex">
            <Button>
              <Plus size={16} /> Add client
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6">
      {/* Page Title & Save Action */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-ink"
          >
            <ArrowLeft size={16} /> Invoices
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-ink">
              {isGstInvoice ? "Create GST Tax Invoice" : "Create Commercial Invoice"}
            </h1>
            {isGstInvoice && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                <FileCheck2 size={13} /> GST Active
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {isGstInvoice
              ? "Generates an official Indian GST Tax Invoice with HSN codes, Place of Supply & CGST/SGST/IGST breakdown."
              : "Generates a clean commercial invoice. You can toggle GST compliance below if registered."}
          </p>
        </div>

        <Button type="submit" loading={saving}>
          Save Invoice
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* GST Mode Selector Banner */}
          <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-panel sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                  isGstInvoice ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                <Building2 size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-ink">GST Tax Invoice Mode</p>
                <p className="text-xs text-slate-500">
                  {user?.isGstRegistered
                    ? `Your organization is registered (GSTIN: ${user.gstin || "Configured"}).`
                    : "Enable to calculate CGST, SGST, IGST and attach HSN codes."}
                </p>
              </div>
            </div>

            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={isGstInvoice}
                onChange={(e) => setIsGstInvoice(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-5 peer-focus:outline-none"></div>
            </label>
          </div>

          {/* Invoice Details */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
            <h2 className="text-base font-black text-ink">Invoice & Recipient Details</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2 block">
                <span className="text-sm font-semibold text-slate-800">Select Client / Buyer</span>
                <select
                  value={clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `— ${c.company}` : ""} {c.gstin ? `(GSTIN: ${c.gstin})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              {/* Show selected client GST context */}
              {selectedClient && (
                <div className="sm:col-span-2 flex flex-wrap items-center gap-4 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600">
                  <div>
                    <span className="font-bold text-slate-700">Client GSTIN: </span>
                    {selectedClient.gstin ? (
                      <span className="font-mono font-bold text-emerald-800">{selectedClient.gstin}</span>
                    ) : (
                      <span className="italic text-slate-400">Unregistered / Consumer</span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Client State: </span>
                    <span>{selectedClient.state || selectedClient.stateCode || "Not set"}</span>
                  </div>
                </div>
              )}

              <Field
                label="Issue Date"
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
              <Field
                label="Due Date"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />

              {isGstInvoice ? (
                <>
                  <div>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-800">Place of Supply</span>
                      <select
                        value={placeOfSupply}
                        onChange={(e) => setPlaceOfSupply(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
                      >
                        <option value="">Select State Code</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s.code} value={`${s.code} - ${s.name}`}>
                            {s.code} — {s.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div>
                    <Field
                      label="Overall Discount (%)"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={discountRate}
                      onChange={(e) => setDiscountRate(Number(e.target.value))}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Field
                    label="Tax Rate (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                  />
                  <Field
                    label="Discount (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(Number(e.target.value))}
                  />
                </>
              )}

              <label className="sm:col-span-2 block">
                <span className="text-sm font-semibold text-slate-800">Notes & Payment Instructions</span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Thanks for choosing us! Payment due via RTGS/NEFT or scan UPI QR code."
                  className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
                />
              </label>
            </div>
          </section>

          {/* Line Items */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-ink">Line Items & Services</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {isGstInvoice
                    ? "Enter description, HSN/SAC code, quantity, unit rate, and GST rate percentage."
                    : "Add billable line items and hourly or fixed rates."}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setItems([
                    ...items,
                    {
                      description: "",
                      quantity: 1,
                      rate: 0,
                      hsnSac: isGstInvoice ? "998311" : "",
                      gstRate: 18,
                    },
                  ])
                }
                className="inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="mt-5 space-y-3.5">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_110px_90px_110px_100px_40px] sm:items-end"
                >
                  <label className="block sm:col-span-1">
                    <span className="text-xs font-bold text-slate-500">Description</span>
                    <input
                      value={item.description}
                      onChange={(e) => setItem(idx, { description: e.target.value })}
                      placeholder="e.g. UI/UX Design, Consulting"
                      className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
                    />
                  </label>

                  {isGstInvoice ? (
                    <div>
                      <span className="text-xs font-bold text-slate-500">HSN/SAC</span>
                      <input
                        value={item.hsnSac || ""}
                        onChange={(e) => setItem(idx, { hsnSac: e.target.value })}
                        placeholder="e.g. 998311"
                        className="mt-1 w-full rounded-xl border border-line bg-white px-2.5 py-2 text-sm font-mono outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
                      />
                    </div>
                  ) : null}

                  <Field
                    label="Qty"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={item.quantity}
                    onChange={(e) => setItem(idx, { quantity: Number(e.target.value) })}
                  />

                  <Field
                    label={`Rate (${currency})`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.rate}
                    onChange={(e) => setItem(idx, { rate: Number(e.target.value) })}
                  />

                  {isGstInvoice ? (
                    <div>
                      <span className="text-xs font-bold text-slate-500">GST %</span>
                      <select
                        value={item.gstRate ?? 18}
                        onChange={(e) => setItem(idx, { gstRate: Number(e.target.value) })}
                        className="mt-1 w-full rounded-xl border border-line bg-white px-2 py-2 text-sm font-bold outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
                      >
                        {GST_RATES.map((rate) => (
                          <option key={rate} value={rate}>
                            {rate}%
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => items.length > 1 && setItems(items.filter((_, i) => i !== idx))}
                      className="mb-1 rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                      disabled={items.length === 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Live Calculation Sidebar */}
        <aside className="space-y-5">
          {/* Tax Jurisdiction Badge */}
          {isGstInvoice && (
            <div
              className={`rounded-3xl border p-5 text-xs ${
                totals.isIntraState
                  ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                  : "border-sky-200 bg-sky-50/70 text-sky-900"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <ShieldCheck size={16} />
                {totals.isIntraState ? "Intra-State Supply (CGST + SGST)" : "Inter-State Supply (IGST)"}
              </div>
              <p className="mt-2 leading-relaxed">
                {totals.isIntraState
                  ? `Seller and Buyer are in the same jurisdiction (${user?.state || "Local"}). Tax splits into Central GST and State GST.`
                  : `Seller (${user?.state || "Origin"}) and Buyer (${
                      selectedClient?.state || placeOfSupply || "Destination"
                    }) are in different jurisdictions. IGST applies.`}
              </p>
            </div>
          )}

          {/* Totals Summary */}
          <section className="rounded-3xl border border-slate-200 bg-ink p-6 text-white shadow-panel">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
              <Calculator size={16} /> Live Tax & Totals
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Taxable Subtotal</span>
                <span>{money(totals.subtotal, currency)}</span>
              </div>

              {totals.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Discount ({discountRate}%)</span>
                  <span className="text-emerald-400">-{money(totals.discount, currency)}</span>
                </div>
              )}

              {isGstInvoice ? (
                totals.isIntraState ? (
                  <>
                    <div className="flex justify-between border-t border-slate-800 pt-2 text-xs">
                      <span className="text-slate-400">Central GST (CGST)</span>
                      <span>{money(totals.cgst, currency)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">State GST (SGST)</span>
                      <span>{money(totals.sgst, currency)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between border-t border-slate-800 pt-2 text-xs">
                    <span className="text-slate-400">Integrated GST (IGST)</span>
                    <span>{money(totals.igst, currency)}</span>
                  </div>
                )
              ) : (
                <div className="flex justify-between border-t border-slate-800 pt-2 text-xs">
                  <span className="text-slate-400">Standard Tax ({taxRate}%)</span>
                  <span>{money(totals.totalTax, currency)}</span>
                </div>
              )}

              <div className="mt-4 border-t border-slate-700 pt-4">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-slate-400">
                      Total Invoice Amount
                    </span>
                    <span className="text-xs text-slate-400">Inclusive of all taxes</span>
                  </div>
                  <span className="text-2xl font-black text-white">{money(totals.total, currency)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Workflow Note */}
          <section className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-brand-800">
              <Copy size={16} /> Compliance Ready
            </div>
            <p className="mt-2 text-xs leading-5 text-brand-900/70">
              Saving this invoice attaches all GST numbers, place of supply records, and bank transfer credentials to both the online client portal and printable PDF.
            </p>
          </section>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}
        </aside>
      </div>
    </form>
  );
}
