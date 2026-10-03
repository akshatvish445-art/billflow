import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, unauthorized } from "@/lib/http";
import { z } from "zod";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const invoiceCount = await prisma.invoice.count({
    where: { userId: user.id },
  });

  const planKey = (
    user.plan in SUBSCRIPTION_PLANS ? user.plan : "STARTER"
  ) as keyof typeof SUBSCRIPTION_PLANS;
  const currentPlan = SUBSCRIPTION_PLANS[planKey];

  return NextResponse.json({
    plan: user.plan || "STARTER",
    planStatus: user.planStatus || "ACTIVE",
    planPeriod: user.planPeriod || "MONTHLY",
    invoiceCount,
    details: currentPlan,
    availablePlans: SUBSCRIPTION_PLANS,
  });
}

const updatePlanSchema = z.object({
  plan: z.enum(["STARTER", "PRO", "ORGANIZATION"]),
  period: z.enum(["MONTHLY", "YEARLY"]).optional().default("MONTHLY"),
});

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const json = await req.json();
    const parsed = updatePlanSchema.safeParse(json);
    if (!parsed.success) {
      return errorResponse("Invalid plan selection.", 400);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: parsed.data.plan,
        planPeriod: parsed.data.period,
        planStatus: "ACTIVE",
        ...(parsed.data.plan === "ORGANIZATION" && !user.isGstRegistered ? { isGstRegistered: true } : {}),
      },
    });

    const planKey = updated.plan as keyof typeof SUBSCRIPTION_PLANS;

    return NextResponse.json({
      success: true,
      message: `Successfully switched to the ${SUBSCRIPTION_PLANS[planKey].name} plan ($${SUBSCRIPTION_PLANS[planKey].price}/month).`,
      user: {
        id: updated.id,
        plan: updated.plan,
        planStatus: updated.planStatus,
        planPeriod: updated.planPeriod,
        isGstRegistered: updated.isGstRegistered,
      },
      details: SUBSCRIPTION_PLANS[planKey],
    });
  } catch (error) {
    console.error("subscription.update", error);
    return errorResponse("Could not update subscription plan.", 500);
  }
}
