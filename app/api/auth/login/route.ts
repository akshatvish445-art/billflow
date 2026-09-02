import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authSchema } from "@/lib/validators";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { errorResponse } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const parsed = authSchema.safeParse(await req.json());
    if (!parsed.success) return errorResponse("Enter a valid email and password.");

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return errorResponse("Invalid email or password.", 401);
    }

    await setSessionCookie(user.id);
    return NextResponse.json({ user: { id: user.id, email: user.email } });
  } catch {
    return errorResponse("Unable to sign in.", 500);
  }
}
