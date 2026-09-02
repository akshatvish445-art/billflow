import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validators";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { errorResponse } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) return errorResponse("Use a valid name, business name, email and password of at least 8 characters.");

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return errorResponse("An account with this email already exists.", 409);

    const businessName = parsed.data.businessName;
    const invoicePrefix = businessName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((x) => x[0])
      .join("")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 12) || "INV";

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(parsed.data.password),
        name: parsed.data.name,
        businessName,
        currency: "INR",
        invoicePrefix,
        invoiceSequence: 1000,
      },
      select: { id: true, email: true },
    });

    await setSessionCookie(user.id);
    return NextResponse.json({ user });
  } catch {
    return errorResponse("Unable to create account.", 500);
  }
}
