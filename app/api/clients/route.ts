export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validators";
import { errorResponse, unauthorized } from "@/lib/http";
import { parseGstin, getStateByCode } from "@/lib/gst";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || 25)));

  const where = {
    userId: user.id,
    ...(q
      ? { OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { company: { contains: q, mode: "insensitive" as const } },
        ] }
      : {}),
  };

  const [clients, total] = await prisma.$transaction([
    prisma.client.findMany({ where, include: { _count: { select: { invoices: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.client.count({ where }),
  ]);

  return NextResponse.json({ clients, pagination: { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) } });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const parsed = clientSchema.safeParse(await req.json());
    if (!parsed.success) return errorResponse("Please enter a valid name and email.");
    
    let gstin = parsed.data.gstin?.trim().toUpperCase() || null;
    let state = parsed.data.state?.trim() || null;
    let stateCode = parsed.data.stateCode?.trim() || null;

    if (gstin && gstin.length >= 2) {
      const gstinInfo = parseGstin(gstin);
      if (gstinInfo.isValid) {
        if (!stateCode) stateCode = gstinInfo.stateCode || null;
        if (!state) state = gstinInfo.stateName || null;
      }
    } else if (stateCode && !state) {
      state = getStateByCode(stateCode)?.name || state;
    }

    const client = await prisma.client.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company || null,
        address: parsed.data.address || null,
        phone: parsed.data.phone || null,
        gstin,
        state,
        stateCode,
        userId: user.id,
      },
    });
    return NextResponse.json({ client }, { status: 201 });
  } catch {
    return errorResponse("Could not create client.", 500);
  }
}
