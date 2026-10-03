/**
 * Executive-Grade PDF Generator for BillFlow
 * Generates vector-rendered, publication-quality commercial and Indian GST tax invoices
 * matching the exact on-screen layout, styling, and typography of the invoice viewer.
 */

export type PdfInvoice = {
  number: string;
  issueDate: Date;
  dueDate: Date;
  notes?: string | null;
  taxRate: unknown;
  discountRate: unknown;
  isGstInvoice?: boolean;
  placeOfSupply?: string | null;
  cgstAmount?: unknown;
  sgstAmount?: unknown;
  igstAmount?: unknown;
  client: {
    name: string;
    company?: string | null;
    email: string;
    address?: string | null;
    phone?: string | null;
    gstin?: string | null;
    state?: string | null;
    stateCode?: string | null;
  };
  business: {
    name: string;
    currency: string;
    logoData?: string | null;
    gstin?: string | null;
    pan?: string | null;
    businessAddress?: string | null;
    state?: string | null;
    stateCode?: string | null;
    bankName?: string | null;
    bankAccountNo?: string | null;
    bankIfsc?: string | null;
    bankBranch?: string | null;
    upiId?: string | null;
  };
  lineItems: {
    description: string;
    quantity: unknown;
    rate: unknown;
    hsnSac?: string | null;
    gstRate?: unknown;
  }[];
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
  };
  status: string;
};

// Safe string escaping for PDF literals
function pdfEscape(val: unknown): string {
  return String(val ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, (char) => {
      if (char === "₹") return "INR ";
      if (char === "€") return "EUR ";
      if (char === "£") return "GBP ";
      if (char === "¥") return "JPY ";
      return " ";
    })
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

// Approximate Helvetica character widths for right alignment
function charWidth(char: string, bold: boolean): number {
  if (char === " " || char === "." || char === "," || char === ":" || char === ";") return 0.278;
  if (char === "i" || char === "l" || char === "'" || char === "!" || char === "|") return 0.23;
  if (char === "m" || char === "w" || char === "M" || char === "W") return 0.85;
  if (char >= "0" && char <= "9") return 0.556;
  if (char >= "A" && char <= "Z") return bold ? 0.72 : 0.67;
  if (char === "-" || char === "/" || char === "(" || char === ")") return 0.35;
  return bold ? 0.58 : 0.52;
}

function textWidth(text: string, size: number, bold = false): number {
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    total += charWidth(text[i], bold) * size;
  }
  return total;
}

function formatPdfMoney(amount: number, currency: string): string {
  const code = (currency || "INR").toUpperCase();
  const num = (Number.isFinite(amount) ? amount : 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (code === "USD") return `$${num}`;
  if (code === "EUR") return `EUR ${num}`;
  if (code === "GBP") return `GBP ${num}`;
  if (code === "INR") return `INR ${num}`;
  return `${code} ${num}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

export function buildInvoicePdf(invoice: PdfInvoice): Buffer {
  const stream: string[] = [];

  // Graphics state helpers
  const fillRect = (x: number, y: number, w: number, h: number, r: number, g: number, b: number) => {
    stream.push(
      `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg ${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f`
    );
  };

  const strokeRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    g: number,
    b: number,
    lineWidth = 1
  ) => {
    stream.push(
      `${lineWidth} w ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re S`
    );
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, r: number, g: number, b: number, width = 1) => {
    stream.push(
      `${width} w ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${x1.toFixed(1)} ${y1.toFixed(1)} m ${x2.toFixed(1)} ${y2.toFixed(1)} l S`
    );
  };

  const addText = (
    x: number,
    y: number,
    size: number,
    text: string,
    bold = false,
    r = 0.06,
    g = 0.09,
    b = 0.16
  ) => {
    const safe = pdfEscape(text);
    stream.push(
      `BT /${bold ? "F2" : "F1"} ${size} Tf ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg 1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm (${safe}) Tj ET`
    );
  };

  const addRightText = (
    rightX: number,
    y: number,
    size: number,
    text: string,
    bold = false,
    r = 0.06,
    g = 0.09,
    b = 0.16
  ) => {
    const safe = pdfEscape(text);
    const w = textWidth(safe, size, bold);
    const x = rightX - w;
    stream.push(
      `BT /${bold ? "F2" : "F1"} ${size} Tf ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg 1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm (${safe}) Tj ET`
    );
  };

  // Dimensions & Margins (US Letter 612 x 792)
  const left = 36;
  const right = 576;
  const pageWidth = right - left; // 540

  const isGst = Boolean(invoice.isGstInvoice || invoice.business.gstin);
  const cgstVal = Number(invoice.cgstAmount || invoice.totals.cgst || 0);
  const sgstVal = Number(invoice.sgstAmount || invoice.totals.sgst || 0);
  const igstVal = Number(invoice.igstAmount || invoice.totals.igst || 0);
  const isIntraState = cgstVal > 0 || sgstVal > 0;

  // 1. Top Decorative Brand Bar
  fillRect(left, 768, pageWidth, 4, isGst ? 0.02 : 0.31, isGst ? 0.59 : 0.27, isGst ? 0.41 : 0.90);

  // 2. Header Section
  // Monogram Logo Badge
  const monogram = (invoice.business.name || "BF").slice(0, 2).toUpperCase();
  fillRect(left, 712, 42, 42, 0.06, 0.09, 0.16);
  addText(left + 9, 725, 15, monogram, true, 1, 1, 1);

  // Business Name & Subtitle
  addText(left + 52, 737, 16, invoice.business.name || "Business Workspace", true, 0.06, 0.09, 0.16);
  addText(
    left + 52,
    723,
    8.5,
    isGst ? "Registered GST Organization" : "Commercial Billing Workspace",
    false,
    0.45,
    0.50,
    0.60
  );

  // Seller Organization Box (Address + GSTIN / PAN / State)
  if (invoice.business.businessAddress || invoice.business.gstin) {
    const sellerBoxY = 668;
    const sellerBoxH = 46;
    fillRect(left + 52, sellerBoxY, 280, sellerBoxH, 0.97, 0.98, 0.99);
    strokeRect(left + 52, sellerBoxY, 280, sellerBoxH, 0.88, 0.91, 0.94, 0.6);

    let sY = sellerBoxY + sellerBoxH - 12;
    if (invoice.business.businessAddress) {
      addText(left + 60, sY, 7.5, invoice.business.businessAddress.slice(0, 58), false, 0.35, 0.40, 0.50);
      sY -= 11;
    }
    const gstRow = [
      invoice.business.gstin ? `GSTIN: ${invoice.business.gstin}` : "",
      invoice.business.pan ? `PAN: ${invoice.business.pan}` : "",
      invoice.business.state ? `State: ${invoice.business.state} (${invoice.business.stateCode || ""})` : "",
    ]
      .filter(Boolean)
      .join("  |  ");
    if (gstRow) {
      addText(left + 60, sY, 7, gstRow, true, 0.18, 0.24, 0.35);
    }
  }

  // Right Header: TAX INVOICE title, Invoice Number, Status Badge & Place of Supply
  addRightText(right, 738, 11, isGst ? "TAX INVOICE" : "INVOICE", true, isGst ? 0.05 : 0.31, isGst ? 0.55 : 0.27, isGst ? 0.38 : 0.90);
  addRightText(right, 715, 20, invoice.number, true, 0.06, 0.09, 0.16);

  // Status Badge Pill
  const normStatus = (invoice.status || "DRAFT").toUpperCase();
  let badgeFill = [0.93, 0.95, 0.98];
  let badgeStroke = [0.8, 0.85, 0.92];
  let badgeTextColor = [0.25, 0.3, 0.4];
  let badgeLabel = normStatus;

  if (normStatus === "PAID") {
    badgeFill = [0.92, 0.98, 0.94];
    badgeStroke = [0.65, 0.90, 0.75];
    badgeTextColor = [0.04, 0.48, 0.24];
    badgeLabel = "PAID";
  } else if (normStatus === "OVERDUE") {
    badgeFill = [0.99, 0.92, 0.92];
    badgeStroke = [0.96, 0.65, 0.65];
    badgeTextColor = [0.75, 0.15, 0.15];
    badgeLabel = "OVERDUE";
  } else if (normStatus === "SENT") {
    badgeFill = [0.93, 0.96, 1.0];
    badgeStroke = [0.70, 0.82, 0.98];
    badgeTextColor = [0.12, 0.38, 0.82];
    badgeLabel = "SENT";
  }

  const badgeW = textWidth(badgeLabel, 8.5, true) + 16;
  fillRect(right - badgeW, 692, badgeW, 16, badgeFill[0], badgeFill[1], badgeFill[2]);
  strokeRect(right - badgeW, 692, badgeW, 16, badgeStroke[0], badgeStroke[1], badgeStroke[2], 0.75);
  addRightText(right - 8, 696, 8.5, badgeLabel, true, badgeTextColor[0], badgeTextColor[1], badgeTextColor[2]);

  if (isGst && invoice.placeOfSupply) {
    addRightText(right, 676, 8, `Place of Supply: ${invoice.placeOfSupply.slice(0, 28)}`, false, 0.4, 0.45, 0.55);
  }

  // Divider
  drawLine(left, 656, right, 656, 0.88, 0.91, 0.94, 1);

  // 3. Three-Column Metadata Cards (y: 574 to 648)
  // Column 1: Billed To (Buyer)
  addText(left, 642, 7.5, "BILLED TO (BUYER)", true, 0.55, 0.60, 0.70);
  addText(left, 627, 10.5, invoice.client.name, true, 0.08, 0.11, 0.18);
  let cY = 614;
  if (invoice.client.company) {
    addText(left, cY, 8.5, invoice.client.company, false, 0.30, 0.35, 0.45);
    cY -= 11;
  }
  if (invoice.client.address) {
    addText(left, cY, 7.5, invoice.client.address.replace(/\r?\n/g, ", ").slice(0, 44), false, 0.45, 0.50, 0.60);
    cY -= 10;
  }
  addText(left, cY, 7.5, invoice.client.email, false, 0.45, 0.50, 0.60);
  cY -= 11;
  if (invoice.client.gstin) {
    const gstinText = `GSTIN: ${invoice.client.gstin}`;
    const gW = textWidth(gstinText, 7.5, true) + 10;
    fillRect(left, cY - 2, gW, 13, 0.93, 0.98, 0.95);
    strokeRect(left, cY - 2, gW, 13, 0.65, 0.90, 0.75, 0.6);
    addText(left + 5, cY + 1, 7.5, gstinText, true, 0.05, 0.45, 0.25);
  }

  // Column 2: Issue Date & Terms
  const col2X = left + 235;
  addText(col2X, 642, 7.5, "ISSUE DATE", true, 0.55, 0.60, 0.70);
  addText(col2X, 627, 9.5, formatDate(invoice.issueDate), true, 0.08, 0.11, 0.18);

  addText(col2X, 608, 7.5, "PAYMENT TERMS", true, 0.55, 0.60, 0.70);
  addText(col2X, 595, 8, "Due within 14 days of receipt", false, 0.35, 0.40, 0.50);

  // Column 3: Due Date & Supply Type
  const col3X = left + 395;
  addText(col3X, 642, 7.5, "DUE DATE", true, 0.55, 0.60, 0.70);
  addText(
    col3X,
    627,
    9.5,
    formatDate(invoice.dueDate),
    true,
    normStatus === "OVERDUE" ? 0.75 : 0.08,
    normStatus === "OVERDUE" ? 0.15 : 0.11,
    normStatus === "OVERDUE" ? 0.15 : 0.18
  );

  if (isGst) {
    addText(col3X, 608, 7.5, "SUPPLY TYPE", true, 0.55, 0.60, 0.70);
    addText(col3X, 595, 8, isIntraState ? "Intra-State (CGST + SGST)" : "Inter-State (IGST)", true, 0.15, 0.25, 0.40);
  }

  // Divider before Line Items
  drawLine(left, 560, right, 560, 0.88, 0.91, 0.94, 1);

  // 4. Line Items Table (y: 535 downwards)
  const tableTop = 535;
  const colDesc = left + 10;
  const colHsn = isGst ? left + 225 : left + 240;
  const colQty = left + 300;
  const colRate = left + 375;
  const colGst = left + 445;
  const colAmount = right - 10;

  // Header Row Box
  fillRect(left, tableTop - 22, pageWidth, 22, 0.07, 0.10, 0.16);
  addText(colDesc, tableTop - 15, 8, "DESCRIPTION", true, 0.95, 0.96, 0.98);
  if (isGst) addText(colHsn, tableTop - 15, 8, "HSN/SAC", true, 0.95, 0.96, 0.98);
  addRightText(colQty, tableTop - 15, 8, "QTY", true, 0.95, 0.96, 0.98);
  addRightText(colRate, tableTop - 15, 8, "RATE", true, 0.95, 0.96, 0.98);
  if (isGst) addRightText(colGst, tableTop - 15, 8, "GST %", true, 0.95, 0.96, 0.98);
  addRightText(colAmount, tableTop - 15, 8, "AMOUNT", true, 0.95, 0.96, 0.98);

  let currentY = tableTop - 22;
  let rowIndex = 0;

  for (const item of invoice.lineItems) {
    if (currentY < 210) break;
    const rowH = 22;
    currentY -= rowH;

    if (rowIndex % 2 === 1) {
      fillRect(left, currentY, pageWidth, rowH, 0.97, 0.98, 0.99);
    }
    drawLine(left, currentY, right, currentY, 0.90, 0.92, 0.95, 0.7);

    const qty = Number(item.quantity) || 1;
    const rate = Number(item.rate) || 0;
    const amount = qty * rate;
    const gstRateVal = item.gstRate ? `${Number(item.gstRate)}%` : "18%";

    addText(colDesc, currentY + 7, 8.5, item.description.slice(0, 32), true, 0.10, 0.13, 0.20);
    if (isGst) {
      addText(colHsn, currentY + 7, 8, (item.hsnSac || "—").slice(0, 10), false, 0.35, 0.40, 0.50);
    }
    addRightText(colQty, currentY + 7, 8.5, String(qty), false, 0.30, 0.35, 0.45);
    addRightText(colRate, currentY + 7, 8.5, formatPdfMoney(rate, invoice.business.currency), false, 0.30, 0.35, 0.45);
    if (isGst) {
      addRightText(colGst, currentY + 7, 8, gstRateVal, false, 0.35, 0.40, 0.50);
    }
    addRightText(colAmount, currentY + 7, 8.5, formatPdfMoney(amount, invoice.business.currency), true, 0.08, 0.11, 0.18);

    rowIndex++;
  }

  // Bottom table line
  drawLine(left, currentY, right, currentY, 0.85, 0.88, 0.92, 1);

  // 5. Bottom Section: Bank / Notes (Left) & Totals (Right)
  const summaryTop = currentY - 16;

  // Left Column: Bank & Wire Settlement Details Card (matching on-screen card)
  const bankCardW = 280;
  const bankCardH = 100;
  fillRect(left, summaryTop - bankCardH, bankCardW, bankCardH, 0.98, 0.99, 1.0);
  strokeRect(left, summaryTop - bankCardH, bankCardW, bankCardH, 0.88, 0.91, 0.94, 0.8);
  fillRect(left, summaryTop - bankCardH, 3, bankCardH, isGst ? 0.05 : 0.31, isGst ? 0.55 : 0.27, isGst ? 0.38 : 0.90);

  addText(left + 12, summaryTop - 15, 8, "BANK & WIRE SETTLEMENT DETAILS", true, 0.35, 0.40, 0.50);
  let bY = summaryTop - 28;

  if (invoice.business.bankName || invoice.business.bankAccountNo) {
    if (invoice.business.bankName) {
      addText(left + 12, bY, 7.5, "Bank:", false, 0.45, 0.50, 0.60);
      addText(left + 58, bY, 7.5, invoice.business.bankName, true, 0.10, 0.13, 0.20);
      bY -= 11;
    }
    if (invoice.business.bankAccountNo) {
      addText(left + 12, bY, 7.5, "A/C No:", false, 0.45, 0.50, 0.60);
      addText(left + 58, bY, 7.5, invoice.business.bankAccountNo, true, 0.10, 0.13, 0.20);
      bY -= 11;
    }
    if (invoice.business.bankIfsc) {
      addText(left + 12, bY, 7.5, "IFSC:", false, 0.45, 0.50, 0.60);
      addText(left + 58, bY, 7.5, invoice.business.bankIfsc, true, 0.10, 0.13, 0.20);
      bY -= 11;
    }
    if (invoice.business.bankBranch) {
      addText(left + 12, bY, 7.5, "Branch:", false, 0.45, 0.50, 0.60);
      addText(left + 58, bY, 7.5, invoice.business.bankBranch.slice(0, 36), false, 0.20, 0.25, 0.35);
      bY -= 11;
    }
    if (invoice.business.upiId) {
      addText(left + 12, bY, 7.5, "UPI VPA:", false, 0.45, 0.50, 0.60);
      addText(left + 58, bY, 7.5, invoice.business.upiId, true, 0.05, 0.45, 0.25);
      bY -= 11;
    }
  } else if (invoice.notes) {
    const noteLines = invoice.notes.split(/\r?\n/).slice(0, 4);
    for (const nl of noteLines) {
      addText(left + 12, bY, 7.5, nl.slice(0, 48), false, 0.25, 0.30, 0.40);
      bY -= 11;
    }
  } else {
    addText(left + 12, bY, 7.5, "Please remit payment by the due date.", false, 0.35, 0.40, 0.50);
  }

  // Notes box if bank details took the primary card and notes exist
  if (invoice.notes && (invoice.business.bankName || invoice.business.bankAccountNo)) {
    const notesY = summaryTop - bankCardH - 24;
    addText(left, notesY + 12, 7.5, "NOTES & TERMS", true, 0.55, 0.60, 0.70);
    addText(left, notesY, 7.5, invoice.notes.slice(0, 70), false, 0.35, 0.40, 0.50);
  }

  // Right Column: Financial Totals Box (matching on-screen card)
  const summaryBoxW = 230;
  const summaryBoxLeft = right - summaryBoxW;
  let sumY = summaryTop;

  // Subtotal
  addText(summaryBoxLeft + 10, sumY - 12, 8.5, "Taxable Subtotal", false, 0.40, 0.45, 0.55);
  addRightText(right - 10, sumY - 12, 8.5, formatPdfMoney(invoice.totals.subtotal, invoice.business.currency), false, 0.10, 0.13, 0.20);
  sumY -= 17;

  // Discount
  const discountRate = Number(invoice.discountRate) || 0;
  if (discountRate > 0 || invoice.totals.discount > 0) {
    addText(summaryBoxLeft + 10, sumY - 12, 8.5, `Discount (${discountRate.toFixed(1)}%)`, false, 0.40, 0.45, 0.55);
    addRightText(right - 10, sumY - 12, 8.5, `-${formatPdfMoney(invoice.totals.discount, invoice.business.currency)}`, false, 0.05, 0.55, 0.30);
    sumY -= 17;
  }

  // Tax Breakdown
  if (isGst) {
    if (isIntraState) {
      addText(summaryBoxLeft + 10, sumY - 12, 8, "Central Tax (CGST)", false, 0.40, 0.45, 0.55);
      addRightText(right - 10, sumY - 12, 8, formatPdfMoney(cgstVal, invoice.business.currency), false, 0.10, 0.13, 0.20);
      sumY -= 15;

      addText(summaryBoxLeft + 10, sumY - 12, 8, "State Tax (SGST)", false, 0.40, 0.45, 0.55);
      addRightText(right - 10, sumY - 12, 8, formatPdfMoney(sgstVal, invoice.business.currency), false, 0.10, 0.13, 0.20);
      sumY -= 15;
    } else {
      addText(summaryBoxLeft + 10, sumY - 12, 8, "Integrated Tax (IGST)", false, 0.40, 0.45, 0.55);
      addRightText(right - 10, sumY - 12, 8, formatPdfMoney(igstVal, invoice.business.currency), false, 0.10, 0.13, 0.20);
      sumY -= 15;
    }
  } else {
    const taxRate = Number(invoice.taxRate) || 0;
    if (taxRate > 0 || invoice.totals.tax > 0) {
      addText(summaryBoxLeft + 10, sumY - 12, 8.5, `Tax (${taxRate.toFixed(1)}%)`, false, 0.40, 0.45, 0.55);
      addRightText(right - 10, sumY - 12, 8.5, formatPdfMoney(invoice.totals.tax, invoice.business.currency), false, 0.10, 0.13, 0.20);
      sumY -= 17;
    }
  }

  // Prominent Total Due Box
  sumY -= 6;
  const totalBoxH = 32;
  fillRect(summaryBoxLeft, sumY - totalBoxH, summaryBoxW, totalBoxH, 0.06, 0.09, 0.16);
  addText(summaryBoxLeft + 12, sumY - 20, 10, "Total Amount Due", true, 0.90, 0.93, 0.98);
  addRightText(right - 12, sumY - 20, 12, formatPdfMoney(invoice.totals.total, invoice.business.currency), true, 1.0, 1.0, 1.0);

  // 6. Professional Executive Footer
  const footerY = 36;
  drawLine(left, footerY + 14, right, footerY + 14, 0.88, 0.91, 0.94, 0.8);
  addText(
    left,
    footerY,
    7.5,
    isGst
      ? "This is a computer-generated Tax Invoice under Indian GST Law • No signature required."
      : "This is a computer-generated commercial invoice • No signature required.",
    false,
    0.45,
    0.50,
    0.58
  );
  addRightText(right, footerY, 7.5, "BillFlow Cloud Billing", false, 0.55, 0.60, 0.68);

  // Assemble PDF Document
  const content = `q\n${stream.join("\n")}\nQ`;
  const objects: string[] = [];
  const addObject = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  addObject("<< /Type /Catalog /Pages 2 0 R >>");
  addObject("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  addObject(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>"
  );
  addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  addObject(`<< /Length ${Buffer.byteLength(content, "ascii")} >>\nstream\n${content}\nendstream`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets[index + 1] = Buffer.byteLength(pdf, "binary");
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xref = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  return Buffer.from(pdf, "binary");
}
