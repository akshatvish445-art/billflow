import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BillFlow — Invoicing without the busywork",
  description: "Create polished invoices, send them, share payment links, and track cash flow in one calm workspace.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
