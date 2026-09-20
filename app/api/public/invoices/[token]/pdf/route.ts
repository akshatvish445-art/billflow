import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { effectiveStatus, invoiceTotals } from "@/lib/utils";
import { buildInvoicePdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { publicToken: token },
      include: {
        client: true,
        user: true,
        lineItems: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!invoice || invoice.status === "DRAFT") {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    const pdf = buildInvoicePdf({
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      taxRate: invoice.taxRate,
      discountRate: invoice.discountRate,
      client: invoice.client,
      business: { name: invoice.user.businessName, currency: invoice.user.currency, logoData: invoice.user.logoData },
      lineItems: invoice.lineItems,
      totals: invoiceTotals(invoice),
      status: effectiveStatus(invoice),
    });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.number.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf"`,
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    console.error("public.invoice.pdf", error);
    return new NextResponse("Could not generate invoice PDF", { status: 500 });
  }
}
