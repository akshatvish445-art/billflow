import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, notFoundResponse, unauthorized } from "@/lib/http";
import { effectiveStatus, invoiceTotals } from "@/lib/utils";
import { buildInvoicePdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId: user.id },
      include: { client: true, lineItems: { orderBy: { createdAt: "asc" } } },
    });
    if (!invoice) return notFoundResponse("Invoice");
    const pdf = buildInvoicePdf({
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      taxRate: invoice.taxRate,
      discountRate: invoice.discountRate,
      client: invoice.client,
      business: { name: user.businessName, currency: user.currency },
      lineItems: invoice.lineItems,
      totals: invoiceTotals(invoice),
      status: effectiveStatus(invoice),
    });
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.number.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("invoice.pdf", error);
    return errorResponse("Could not generate invoice PDF.", 500);
  }
}
