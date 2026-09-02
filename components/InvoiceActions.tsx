"use client";
import { CheckCircle2, Copy, Download, ExternalLink, Mail, Printer } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";

export default function InvoiceActions({ invoiceId, publicUrl, status }: { invoiceId: string; publicUrl: string; status: string }) {
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const share = async () => {
    if (status === "draft") return;
    setError("");
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy the public link. Open the public view after sending the invoice.");
    }
  };

  const send = async () => {
    setBusy("send");
    setError("");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Could not send invoice.");
      else window.location.reload();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy("");
    }
  };

  const markPaid = async () => {
    setBusy("paid");
    setError("");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Could not update invoice.");
      else window.location.reload();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        onClick={share}
        disabled={status === "draft"}
        title={status === "draft" ? "Send the invoice before sharing it" : "Copy public invoice link"}
        className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-bold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
        {copied ? "Copied" : "Share link"}
      </button>
      <a href={`/api/invoices/${invoiceId}/pdf`} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-bold hover:bg-slate-50">
        <Download size={16} /> Download PDF
      </a>
      <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-bold hover:bg-slate-50">
        <Printer size={16} /> Print
      </button>
      {status !== "paid" && (
        <Button loading={busy === "send"} onClick={send} variant="secondary">
          <Mail size={16} /> {status === "draft" ? "Send invoice" : "Send again"}
        </Button>
      )}
      {status !== "paid" && status !== "draft" && (
        <Button loading={busy === "paid"} onClick={markPaid}>
          <CheckCircle2 size={16} /> Mark paid
        </Button>
      )}
      {status === "paid" && (
        <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-bold hover:bg-slate-50">
          <ExternalLink size={16} /> Public view
        </a>
      )}
      {error && <p className="basis-full text-right text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
