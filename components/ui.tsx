import { Loader2, AlertCircle, Inbox } from "lucide-react";

export function Spinner({ size = 18 }: { size?: number }) { return <Loader2 className="animate-spin" size={size} />; }
export function Button({ className = "", children, loading, variant = "primary", size = "md", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; variant?: "primary" | "secondary" | "danger" | "ghost"; size?: "sm" | "md" }) {
  const styles = { primary: "bg-ink text-white hover:bg-slate-800", secondary: "border border-line bg-white text-ink hover:bg-slate-50", danger: "bg-rose-50 text-rose-700 hover:bg-rose-100", ghost: "text-slate-600 hover:bg-slate-100" };
  const sizes = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm" };
  return <button className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${styles[variant]} ${className}`} disabled={props.disabled || loading} {...props}>{loading && <Spinner size={16} />}{children}</button>;
}
export function StatusPill({ status }: { status: string }) {
  const key = status.toLowerCase();
  const styles: Record<string, string> = { paid: "bg-emerald-50 text-emerald-700 ring-emerald-100", sent: "bg-sky-50 text-sky-700 ring-sky-100", draft: "bg-slate-100 text-slate-700 ring-slate-200", overdue: "bg-rose-50 text-rose-700 ring-rose-100" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ${styles[key] ?? styles.draft}`}>{key}</span>;
}
export function Field({ label, error, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) { return <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-800">{label}</span><input {...props} className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-50" />{hint && <span className="text-xs text-slate-500">{hint}</span>}{error && <span className="flex items-center gap-1 text-xs font-medium text-rose-600"><AlertCircle size={13} />{error}</span>}</label> }
export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) { return <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white p-8 text-center shadow-panel"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Inbox size={22}/></div><h3 className="text-base font-bold text-ink">{title}</h3><p className="mt-1 max-w-md text-sm leading-6 text-slate-500">{description}</p>{action && <div className="mt-5">{action}</div>}</div> }
