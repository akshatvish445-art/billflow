import { Prisma } from "@prisma/client";

export const currencies = [
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "AED", label: "UAE Dirham", symbol: "د.إ" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
];

export function currencySymbol(code: string) {
  return currencies.find((item) => item.code === code)?.symbol ?? code;
}

export function money(value: number | Prisma.Decimal | string, currency = "INR") {
  const number = Number(value);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: currency === "JPY" ? 0 : 2 }).format(Number.isFinite(number) ? number : 0);
}

export function formatDate(value: Date | string, locale = "en-IN") {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}

export function parseDateInput(value: string) {
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function dateInputValue(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function invoiceTotals(invoice: { taxRate: any; discountRate: any; lineItems: { quantity: any; rate: any }[] }) {
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.rate), 0);
  const discount = subtotal * (Number(invoice.discountRate) / 100);
  const taxable = Math.max(subtotal - discount, 0);
  const tax = taxable * (Number(invoice.taxRate) / 100);
  return { subtotal, discount, tax, total: taxable + tax };
}

export function effectiveStatus(invoice: { status: "DRAFT" | "SENT" | "PAID"; dueDate: Date | string }) {
  if (invoice.status === "PAID") return "paid" as const;
  if (invoice.status === "DRAFT") return "draft" as const;
  return new Date(invoice.dueDate).getTime() < Date.now() ? "overdue" as const : "sent" as const;
}

export function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "B";
}

export function randomToken(bytes = 24) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < bytes; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
