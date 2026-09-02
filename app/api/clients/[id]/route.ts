export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validators";
import { errorResponse, notFoundResponse, unauthorized } from "@/lib/http";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const client = await prisma.client.findFirst({ where: { id, userId: user.id }, include: { _count: { select: { invoices: true } } } });
  if (!client) return notFoundResponse("Client");
  return NextResponse.json({ client });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const found = await prisma.client.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!found) return notFoundResponse("Client");
  try {
    const parsed = clientSchema.safeParse(await req.json());
    if (!parsed.success) return errorResponse("Please enter a valid name and email.");
    const client = await prisma.client.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ client });
  } catch {
    return errorResponse("Could not update client.", 500);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const found = await prisma.client.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!found) return notFoundResponse("Client");
  try {
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return errorResponse("This client has invoices. Keep the client so invoice history stays intact.", 409);
  }
}
