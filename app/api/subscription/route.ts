import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, unauthorized } from "@/lib/http";
import { z } from "zod";

export const dynamic = "force-dynamic";

export const SUBSCRIPTION_PLANS = {
  STARTER: {
    id: "STARTER",
    name: "Starter",
    price: 9,
    interval: "month",
    invoicesLimit: 30,
    features: [
      "Up to 30 active invoices/month",
      "Unlimited clients & contacts",
      "Executive PDF generation & downloads",
      "Branded public invoice payment portal",
      "Multi-currency support (USD, EUR, GBP, INR, etc.)",
      "Automated tax & discount calculation",
      "Custom invoice prefix & numbering",
      "Standard email support",
    ],
  },
  PRO: {
    id: "PRO",
    name: "Pro Studio",
    price: 15,
    interval: "month",
    invoicesLimit: -1, // Unlimited
    features: [
      "Unlimited invoices & line items",
      "Unlimited clients & contacts",
      "Executive PDF invoices with bank callout & status stamps",
      "Automated overdue tracking & payment alerts",
      "Cash flow & revenue analytics dashboard",
      "One-click CSV & financial report export",
      "Custom invoice numbering & business sequence control",
      "Priority 24/7 dedicated support & SLA",
      "Early access to automated retainers & live webhooks",
    ],
  },
} as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const invoiceCount = await prisma.invoice.count({
    where: { userId: user.id },
  });

  const planKey = (user.plan === "PRO" ? "PRO" : "STARTER") as keyof typeof SUBSCRIPTION_PLANS;
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
  plan: z.enum(["STARTER", "PRO"]),
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
      },
      details: SUBSCRIPTION_PLANS[planKey],
    });
  } catch (error) {
    console.error("subscription.update", error);
    return errorResponse("Could not update subscription plan.", 500);
  }
}
