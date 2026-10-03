import { requireUser } from "@/lib/auth";
import { currencies } from "@/lib/utils";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <SettingsForm
      user={{
        businessName: user.businessName,
        currency: user.currency,
        invoicePrefix: user.invoicePrefix,
        logoData: user.logoData,
        plan: user.plan || "STARTER",
        planStatus: user.planStatus || "ACTIVE",
        planPeriod: user.planPeriod || "MONTHLY",
        isGstRegistered: user.isGstRegistered ?? false,
        gstin: user.gstin || "",
        pan: user.pan || "",
        businessAddress: user.businessAddress || "",
        state: user.state || "",
        stateCode: user.stateCode || "",
        bankName: user.bankName || "",
        bankAccountNo: user.bankAccountNo || "",
        bankIfsc: user.bankIfsc || "",
        bankBranch: user.bankBranch || "",
        upiId: user.upiId || "",
      }}
      currencies={currencies}
    />
  );
}

