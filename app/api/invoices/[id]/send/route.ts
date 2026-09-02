import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { escapeHtml, errorResponse, notFoundResponse, unauthorized } from "@/lib/http";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: user.id },
    include: { client: true, lineItems: true },
  });
  if (!invoice) return notFoundResponse("Invoice");
  if (invoice.status === "PAID") return errorResponse("Paid invoices cannot be sent again.", 400);

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: "SENT", sentAt: invoice.sentAt ?? new Date() },
    include: { client: true },
  });

  let emailSent = false;
  let emailError = "";
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
      const publicUrl = `${baseUrl}/invoice/${invoice.publicToken}`;
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL,
          to: [invoice.client.email],
          subject: `Invoice ${invoice.number} from ${user.businessName}`,
          html: `<div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#0f172a"><h2>Invoice ${escapeHtml(invoice.number)}</h2><p>${escapeHtml(user.businessName)} has sent you an invoice.</p><p><a href="${escapeHtml(publicUrl)}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none">View and pay invoice</a></p></div>`,
        }),
      });
      emailSent = response.ok;
      if (!response.ok) emailError = "The invoice was marked sent, but the email provider rejected the request.";
    } catch {
      emailError = "The invoice was marked sent, but email delivery could not be completed.";
    }
  }

  return NextResponse.json({ ok: true, emailSent, ...(emailError ? { emailError } : {}), invoice: updated });
}
