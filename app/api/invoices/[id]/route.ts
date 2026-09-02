export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invoiceSchema } from "@/lib/validators";
import { errorResponse, notFoundResponse, unauthorized } from "@/lib/http";
import { effectiveStatus, invoiceTotals } from "@/lib/utils";

function parseDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (Number.isNaN(date.getTime())) return null;
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

async function getOwnedInvoice(userId: string, id: string) {
  return prisma.invoice.findFirst({
    where: { id, userId },
    include: { client: true, lineItems: { orderBy: { createdAt: "asc" } }, user: true },
  });
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const invoice = await getOwnedInvoice(user.id, id);
  if (!invoice) return notFoundResponse("Invoice");
  return NextResponse.json({ invoice: { ...invoice, computedStatus: effectiveStatus(invoice), totals: invoiceTotals(invoice) } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const current = await prisma.invoice.findFirst({ where: { id, userId: user.id }, include: { lineItems: true } });
  if (!current) return notFoundResponse("Invoice");
  if (current.status === "PAID") return errorResponse("Paid invoices are locked and cannot be edited.", 409);

  try {
    const parsed = invoiceSchema.safeParse(await req.json());
    if (!parsed.success) return errorResponse("Check client, dates, tax, discount and line items.");
    const issueDate = parseDateInput(parsed.data.issueDate);
    const dueDate = parseDateInput(parsed.data.dueDate);
    if (!issueDate || !dueDate) return errorResponse("Enter valid dates.");
    if (dueDate < issueDate) return errorResponse("Due date cannot be before issue date.");

    const client = await prisma.client.findFirst({ where: { id: parsed.data.clientId, userId: user.id }, select: { id: true } });
    if (!client) return notFoundResponse("Client");

    const invoice = await prisma.$transaction(async (tx) => {
      await tx.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
      return tx.invoice.update({
        where: { id },
        data: {
          clientId: client.id,
          issueDate,
          dueDate,
          notes: parsed.data.notes || null,
          taxRate: parsed.data.taxRate,
          discountRate: parsed.data.discountRate,
          lineItems: { create: parsed.data.items.map((item) => ({ description: item.description.trim(), quantity: item.quantity, rate: item.rate })) },
        },
        include: { client: true, lineItems: { orderBy: { createdAt: "asc" } } },
      });
    });

    return NextResponse.json({ invoice: { ...invoice, computedStatus: effectiveStatus(invoice), totals: invoiceTotals(invoice) } });
  } catch (error) {
    console.error("invoice.update", error);
    return errorResponse("Could not update invoice.", 500);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({ where: { id, userId: user.id }, select: { id: true, status: true } });
  if (!invoice) return notFoundResponse("Invoice");
  if (invoice.status === "PAID") return errorResponse("Paid invoices cannot be deleted.", 409);
  try {
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return errorResponse("Could not delete invoice.", 500);
  }
}
