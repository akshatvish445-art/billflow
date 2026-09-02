import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { effectiveStatus } from "@/lib/utils";
import { errorResponse } from "@/lib/http";

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { publicToken: token } });
  if (!invoice || invoice.status === "DRAFT") return errorResponse("Invoice not found.", 404);
  if (invoice.status === "PAID") return NextResponse.json({ ok: true, status: "paid", paidAt: invoice.paidAt });

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: "PAID", paidAt: new Date() },
  });
  return NextResponse.json({ ok: true, status: effectiveStatus(updated), paidAt: updated.paidAt });
}
