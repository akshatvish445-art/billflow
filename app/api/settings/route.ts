import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { settingsSchema, isSafeLogoData } from "@/lib/validators";
import { errorResponse, unauthorized } from "@/lib/http";
import { parseGstin, getStateByCode } from "@/lib/gst";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return NextResponse.json({
    user: {
      businessName: user.businessName,
      currency: user.currency,
      invoicePrefix: user.invoicePrefix,
      logoData: user.logoData,
      plan: user.plan,
      planStatus: user.planStatus,
      planPeriod: user.planPeriod,
      isGstRegistered: user.isGstRegistered,
      gstin: user.gstin,
      pan: user.pan,
      businessAddress: user.businessAddress,
      state: user.state,
      stateCode: user.stateCode,
      bankName: user.bankName,
      bankAccountNo: user.bankAccountNo,
      bankIfsc: user.bankIfsc,
      bankBranch: user.bankBranch,
      upiId: user.upiId,
    },
  });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const parsed = settingsSchema.safeParse(await req.json());
    if (!parsed.success || !isSafeLogoData(parsed.data.logoData)) {
      return errorResponse("Please provide valid business settings and a supported image logo.");
    }

    const logoData = parsed.data.logoData === undefined ? user.logoData : parsed.data.logoData;
    const invoicePrefix =
      parsed.data.invoicePrefix.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 12) || "INV";

    let gstin = parsed.data.gstin?.trim().toUpperCase() || null;
    let pan = parsed.data.pan?.trim().toUpperCase() || null;
    let stateCode = parsed.data.stateCode?.trim() || null;
    let state = parsed.data.state?.trim() || null;

    if (gstin) {
      const gstinInfo = parseGstin(gstin);
      if (gstinInfo.isValid) {
        if (!pan && gstinInfo.pan) pan = gstinInfo.pan;
        if (!stateCode && gstinInfo.stateCode) stateCode = gstinInfo.stateCode;
        if (!state && gstinInfo.stateName) state = gstinInfo.stateName;
      }
    } else if (stateCode && !state) {
      state = getStateByCode(stateCode)?.name || state;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        businessName: parsed.data.businessName,
        currency: parsed.data.currency,
        invoicePrefix,
        logoData: logoData || null,
        isGstRegistered: Boolean(parsed.data.isGstRegistered),
        gstin,
        pan,
        businessAddress: parsed.data.businessAddress?.trim() || null,
        state,
        stateCode,
        bankName: parsed.data.bankName?.trim() || null,
        bankAccountNo: parsed.data.bankAccountNo?.trim() || null,
        bankIfsc: parsed.data.bankIfsc?.trim().toUpperCase() || null,
        bankBranch: parsed.data.bankBranch?.trim() || null,
        upiId: parsed.data.upiId?.trim() || null,
      },
    });

    return NextResponse.json({
      user: {
        businessName: updated.businessName,
        currency: updated.currency,
        invoicePrefix: updated.invoicePrefix,
        logoData: updated.logoData,
        plan: updated.plan,
        planStatus: updated.planStatus,
        planPeriod: updated.planPeriod,
        isGstRegistered: updated.isGstRegistered,
        gstin: updated.gstin,
        pan: updated.pan,
        businessAddress: updated.businessAddress,
        state: updated.state,
        stateCode: updated.stateCode,
        bankName: updated.bankName,
        bankAccountNo: updated.bankAccountNo,
        bankIfsc: updated.bankIfsc,
        bankBranch: updated.bankBranch,
        upiId: updated.upiId,
      },
    });
  } catch (err) {
    console.error("settings.put", err);
    return errorResponse("Could not save settings.", 500);
  }
}
