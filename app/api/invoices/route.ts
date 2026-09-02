export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invoiceSchema } from "@/lib/validators";
import { errorResponse, notFoundResponse, unauthorized } from "@/lib/http";
import { makePublicToken } from "@/lib/invoices";
import { effectiveStatus, invoiceTotals } from "@/lib/utils";

function parseDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (Number.isNaN(date.getTime())) return null;
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const status = url.searchParams.get("status") || "all";
  const clientId = url.searchParams.get("clientId") || "all";
  const sort = url.searchParams.get("sort") || "newest";
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || 25)));

  const where: any = { userId: user.id };
  if (q) {
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { client: { name: { contains: q, mode: "insensitive" } } },
      { client: { company: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (clientId !== "all") where.clientId = clientId;
  if (status === "draft") where.status = "DRAFT";
  if (status === "sent") where.status = "SENT";
  if (status === "paid") where.status = "PAID";
  if (status === "overdue") { where.status = "SENT"; where.dueDate = { lt: new Date() }; }

  const orderBy = sort === "oldest" ? { issueDate: "asc" as const } : sort === "due-soon" ? { dueDate: "asc" as const } : { issueDate: "desc" as const };
  const [invoices, total] = await prisma.$transaction([
    prisma.invoice.findMany({ where, include: { client: true, lineItems: true }, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.invoice.count({ where }),
  ]);

  const data = invoices.map((invoice) => ({ ...invoice, computedStatus: effectiveStatus(invoice), totals: invoiceTotals(invoice) }));
  return NextResponse.json({ invoices: data, pagination: { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) } });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
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
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { invoiceSequence: { increment: 1 } },
        select: { invoicePrefix: true, invoiceSequence: true },
      });
      const number = `${updatedUser.invoicePrefix}-${updatedUser.invoiceSequence}`;
      return tx.invoice.create({
        data: {
          userId: user.id,
          clientId: client.id,
          number,
          issueDate,
          dueDate,
          notes: parsed.data.notes || null,
          taxRate: parsed.data.taxRate,
          discountRate: parsed.data.discountRate,
          status: "DRAFT",
          publicToken: makePublicToken(),
          lineItems: { create: parsed.data.items.map((item) => ({ description: item.description.trim(), quantity: item.quantity, rate: item.rate })) },
        },
        include: { client: true, lineItems: true },
      });
    });

    return NextResponse.json({ invoice: { ...invoice, computedStatus: effectiveStatus(invoice), totals: invoiceTotals(invoice) } }, { status: 201 });
  } catch (error) {
    console.error("invoice.create", error);
    return errorResponse("Could not create invoice.", 500);
  }
}
