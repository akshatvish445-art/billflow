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
      }}
      currencies={currencies}
    />
  );
}

