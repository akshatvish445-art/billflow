export interface IndianState {
  code: string;
  name: string;
}

export const INDIAN_STATES: IndianState[] = [
  { code: "01", name: "Jammu & Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "28", name: "Andhra Pradesh (Old)" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory" },
];

export const GST_RATES = [0, 5, 12, 18, 28];

export function getStateByCode(code?: string | null): IndianState | undefined {
  if (!code) return undefined;
  const clean = code.trim().padStart(2, "0");
  return INDIAN_STATES.find((s) => s.code === clean);
}

export function parseGstin(gstinRaw: string): {
  isValid: boolean;
  stateCode?: string;
  stateName?: string;
  pan?: string;
} {
  const gstin = gstinRaw.trim().toUpperCase();
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!regex.test(gstin)) {
    return { isValid: false };
  }

  const stateCode = gstin.slice(0, 2);
  const pan = gstin.slice(2, 12);
  const stateObj = getStateByCode(stateCode);

  return {
    isValid: true,
    stateCode,
    stateName: stateObj?.name,
    pan,
  };
}

export interface GstCalculationParams {
  items: { quantity: number; rate: number; gstRate?: number | null }[];
  discountRate: number;
  overallTaxRate?: number;
  isGstInvoice?: boolean;
  supplierStateCode?: string | null;
  clientStateCode?: string | null;
}

export interface GstCalculationResult {
  subtotal: number;
  discount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  total: number;
  isIntraState: boolean;
  effectiveTaxRate: number;
}

export function calculateGstBreakdown({
  items,
  discountRate,
  overallTaxRate = 18,
  isGstInvoice = false,
  supplierStateCode,
  clientStateCode,
}: GstCalculationParams): GstCalculationResult {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0);
  const discount = (subtotal * Math.max(0, Math.min(100, Number(discountRate) || 0))) / 100;
  const taxable = Math.max(0, subtotal - discount);

  // If not a GST invoice, standard tax
  if (!isGstInvoice) {
    const taxRate = Math.max(0, Number(overallTaxRate) || 0);
    const tax = (taxable * taxRate) / 100;
    return {
      subtotal,
      discount,
      taxable,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: tax,
      total: taxable + tax,
      isIntraState: false,
      effectiveTaxRate: taxRate,
    };
  }

  const sState = supplierStateCode?.trim().padStart(2, "0");
  const cState = clientStateCode?.trim().padStart(2, "0");
  const isIntraState = Boolean(sState && cState && sState === cState);

  // Itemized or unified calculation
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  // Proportion of discount across items
  const discountRatio = subtotal > 0 ? (subtotal - discount) / subtotal : 1;

  for (const item of items) {
    const itemSubtotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
    const itemTaxable = itemSubtotal * discountRatio;
    const rate = Number(item.gstRate ?? overallTaxRate ?? 18);

    if (isIntraState) {
      const halfRate = rate / 2;
      totalCgst += (itemTaxable * halfRate) / 100;
      totalSgst += (itemTaxable * halfRate) / 100;
    } else {
      totalIgst += (itemTaxable * rate) / 100;
    }
  }

  const totalTax = totalCgst + totalSgst + totalIgst;
  const effectiveTaxRate = taxable > 0 ? (totalTax / taxable) * 100 : overallTaxRate;

  return {
    subtotal,
    discount,
    taxable,
    cgst: Math.round(totalCgst * 100) / 100,
    sgst: Math.round(totalSgst * 100) / 100,
    igst: Math.round(totalIgst * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    total: Math.round((taxable + totalTax) * 100) / 100,
    isIntraState,
    effectiveTaxRate: Math.round(effectiveTaxRate * 10) / 10,
  };
}
