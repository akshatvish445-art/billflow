"use client";

import { useMemo, useState } from "react";
import { Building2, Pencil, Plus, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { Button, EmptyState, Field } from "@/components/ui";
import { INDIAN_STATES, parseGstin } from "@/lib/gst";

export default function ClientsTable({ initialClients }: { initialClients: any[] }) {
  const [clients, setClients] = useState(initialClients);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(
    () =>
      clients.filter((c) =>
        [c.name, c.email, c.company || "", c.gstin || "", c.state || ""].join(" ").toLowerCase().includes(query.toLowerCase())
      ),
    [clients, query]
  );

  const open = (client?: any) => {
    setError("");
    setEditing(
      client
        ? { ...client }
        : {
            name: "",
            email: "",
            company: "",
            address: "",
            phone: "",
            gstin: "",
            state: "",
            stateCode: "",
          }
    );
  };

  const handleGstinChange = (val: string) => {
    const clean = val.toUpperCase().trim();
    const parsed = parseGstin(clean);
    if (parsed.isValid) {
      setEditing((prev: any) => ({
        ...prev,
        gstin: clean,
        stateCode: parsed.stateCode || prev.stateCode,
        state: parsed.stateName || prev.state,
      }));
    } else {
      setEditing((prev: any) => ({ ...prev, gstin: clean }));
    }
  };

  const handleStateCodeChange = (code: string) => {
    const found = INDIAN_STATES.find((s) => s.code === code);
    setEditing((prev: any) => ({
      ...prev,
      stateCode: code,
      state: found?.name || prev.state,
    }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const method = editing.id ? "PATCH" : "POST";
    const url = editing.id ? `/api/clients/${editing.id}` : "/api/clients";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not save client");
      setSaving(false);
      return;
    }
    setClients((prev) =>
      editing.id
        ? prev.map((x) => (x.id === data.client.id ? { ...data.client, _count: x._count } : x))
        : [{ ...data.client, _count: { invoices: 0 } }, ...prev]
    );
    setEditing(null);
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this client? Invoices belonging to this client will prevent deletion.")) return;
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Could not delete client");
      return;
    }
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-600">Relationships & Directory</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-ink">Clients</h1>
          <p className="mt-2 text-sm text-slate-500">
            Keep billing details and client GSTINs updated so every invoice computes the correct taxes.
          </p>
        </div>
        <Button onClick={() => open()}>
          <Plus size={17} /> Add client
        </Button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-panel">
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-md">
            <Search size={17} className="absolute left-3 top-3 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients by name, company, or GSTIN..."
              className="w-full rounded-xl border border-line py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title={clients.length ? "No matching clients" : "No clients yet"}
              description={
                clients.length
                  ? "Try a different search term or check spelling."
                  : "Add your first billing contact or client before issuing an invoice."
              }
              action={
                !clients.length && (
                  <Button onClick={() => open()}>
                    <Plus size={16} /> Add client
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Client & Company</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">GSTIN / Place of Supply</th>
                  <th className="px-5 py-3.5">Invoices</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-4">
                      <p className="font-bold text-ink">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.company || "Individual / Independent"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-700">{c.email}</p>
                      <p className="text-xs text-slate-400">{c.phone || "—"}</p>
                    </td>
                    <td className="px-5 py-4">
                      {c.gstin ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
                            <ShieldCheck size={12} /> {c.gstin}
                          </span>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {c.stateCode ? `${c.stateCode} — ` : ""}
                            {c.state || "State configured"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Non-GST / Unregistered</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {c._count?.invoices || 0}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => open(c)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-ink"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => remove(c.id)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-ink">
                  {editing.id ? "Edit Client" : "Add New Client"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Billing contact and tax credentials for future invoices.
                </p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={save} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Contact Person Name"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
                <Field
                  label="Email Address"
                  type="email"
                  required
                  placeholder="e.g. billing@company.com"
                  value={editing.email}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                />
                <Field
                  label="Company / Enterprise Name"
                  placeholder="e.g. Acme Tech Solutions Pvt Ltd"
                  value={editing.company || ""}
                  onChange={(e) => setEditing({ ...editing, company: e.target.value })}
                />
                <Field
                  label="Phone / Mobile"
                  placeholder="e.g. +91 98765 43210"
                  value={editing.phone || ""}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                />
              </div>

              {/* GST Specifics */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <Building2 size={14} className="text-brand-600" /> GST & Place of Supply (Optional)
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Client GSTIN"
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    value={editing.gstin || ""}
                    onChange={(e) => handleGstinChange(e.target.value)}
                    hint="Auto-extracts buyer state"
                  />
                  <div>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">State / Place of Supply</span>
                      <select
                        value={editing.stateCode || ""}
                        onChange={(e) => handleStateCodeChange(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
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
                </div>
              </div>

              <div>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-800">Billing Address</span>
                  <textarea
                    rows={2}
                    value={editing.address || ""}
                    onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                    placeholder="Floor, Street, City, State, Pincode"
                    className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
                  />
                </label>
              </div>

              {error && (
                <p className="rounded-xl bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  {editing.id ? "Save Changes" : "Create Client"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
