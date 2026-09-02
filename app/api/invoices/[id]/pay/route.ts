import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveStatus } from "@/lib/utils";
import { errorResponse, notFoundResponse, unauthorized } from "@/lib/http";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({ where: { id, userId: user.id } });
  if (!invoice) return notFoundResponse("Invoice");
  if (invoice.status === "PAID") return NextResponse.json({ ok: true, invoice });
  if (invoice.status === "DRAFT") return errorResponse("Draft invoices cannot be marked paid.", 400);

  const updated = await prisma.invoice.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });
  return NextResponse.json({ ok: true, invoice: { ...updated, computedStatus: effectiveStatus(updated) } });
}
