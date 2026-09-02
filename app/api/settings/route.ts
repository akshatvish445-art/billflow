export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { settingsSchema, isSafeLogoData } from "@/lib/validators";
import { errorResponse, unauthorized } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return NextResponse.json({ user: { businessName: user.businessName, currency: user.currency, invoicePrefix: user.invoicePrefix, logoData: user.logoData } });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const parsed = settingsSchema.safeParse(await req.json());
    if (!parsed.success || !isSafeLogoData(parsed.data.logoData)) return errorResponse("Please provide valid business settings and a supported image logo.");

    const logoData = parsed.data.logoData === undefined ? user.logoData : parsed.data.logoData;
    const invoicePrefix = parsed.data.invoicePrefix.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 12) || "INV";
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { businessName: parsed.data.businessName, currency: parsed.data.currency, invoicePrefix, logoData: logoData || null },
    });
    return NextResponse.json({ user: { businessName: updated.businessName, currency: updated.currency, invoicePrefix: updated.invoicePrefix, logoData: updated.logoData } });
  } catch {
    return errorResponse("Could not save settings.", 500);
  }
}
