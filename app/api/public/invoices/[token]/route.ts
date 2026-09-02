export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { effectiveStatus, invoiceTotals } from "@/lib/utils";
import { notFoundResponse } from "@/lib/http";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: token },
    include: { client: true, user: true, lineItems: { orderBy: { createdAt: "asc" } } },
  });
  if (!invoice || invoice.status === "DRAFT") return notFoundResponse("Invoice");

  const status = effectiveStatus(invoice);
  return NextResponse.json({
    invoice: {
      id: invoice.id,
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      status,
      sentAt: invoice.sentAt,
      paidAt: invoice.paidAt,
      publicToken: invoice.publicToken,
      client: { name: invoice.client.name, company: invoice.client.company },
      business: { name: invoice.user.businessName, currency: invoice.user.currency, logoData: invoice.user.logoData },
      lineItems: invoice.lineItems,
      taxRate: invoice.taxRate,
      discountRate: invoice.discountRate,
      totals: invoiceTotals(invoice),
    },
  });
}
