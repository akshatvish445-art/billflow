import { z } from "zod";
import { currencies } from "@/lib/utils";

const currencyCodes = currencies.map((item) => item.code);

export const authSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

export const signupSchema = authSchema.extend({
  name: z.string().trim().min(2).max(120),
  businessName: z.string().trim().min(2).max(160),
});

export const clientSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().max(160).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  gstin: z.string().trim().max(15).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  stateCode: z.string().max(4).optional().or(z.literal("")),
});

export const lineItemSchema = z.object({
  description: z.string().trim().min(1).max(200),
  quantity: z.coerce.number().finite().positive().max(100000),
  rate: z.coerce.number().finite().nonnegative().max(100000000),
  hsnSac: z.string().trim().max(16).optional().or(z.literal("")),
  gstRate: z.coerce.number().finite().min(0).max(100).optional().default(18),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taxRate: z.coerce.number().finite().min(0).max(100),
  discountRate: z.coerce.number().finite().min(0).max(100),
  notes: z.string().max(1000).optional().or(z.literal("")),
  isGstInvoice: z.boolean().optional().default(false),
  placeOfSupply: z.string().max(100).optional().or(z.literal("")),
  items: z.array(lineItemSchema).min(1).max(100),
});

export const settingsSchema = z.object({
  businessName: z.string().trim().min(1).max(160),
  currency: z.string().refine((value: string) => currencyCodes.includes(value), "Unsupported currency."),
  invoicePrefix: z.string().trim().min(1).max(12),
  logoData: z.string().max(7000000).nullable().optional(),
  isGstRegistered: z.boolean().optional().default(false),
  gstin: z.string().trim().max(15).optional().or(z.literal("")),
  pan: z.string().trim().max(10).optional().or(z.literal("")),
  businessAddress: z.string().max(500).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  stateCode: z.string().max(4).optional().or(z.literal("")),
  bankName: z.string().max(120).optional().or(z.literal("")),
  bankAccountNo: z.string().max(40).optional().or(z.literal("")),
  bankIfsc: z.string().max(20).optional().or(z.literal("")),
  bankBranch: z.string().max(120).optional().or(z.literal("")),
  upiId: z.string().max(80).optional().or(z.literal("")),
});

export function isSafeLogoData(value: string | null | undefined) {
  if (!value) return true;
  return /^data:image\/(png|jpeg|jpg|svg\+xml);base64,[a-z0-9+/=\s]+$/i.test(value);
}
