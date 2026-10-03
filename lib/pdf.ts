/**
 * Executive-Grade PDF Generator for BillFlow
 * Generates vector-rendered, publication-quality commercial and Indian GST tax invoices.
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
      // Map common Unicode currency symbols to clean ASCII labels
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

// Approximate Helvetica character widths for pixel-perfect right alignment
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
  const left = 45;
  const right = 567;
  const pageWidth = 522;

  const isGst = Boolean(invoice.isGstInvoice || invoice.business.gstin);
  const cgstVal = Number(invoice.cgstAmount || invoice.totals.cgst || 0);
  const sgstVal = Number(invoice.sgstAmount || invoice.totals.sgst || 0);
  const igstVal = Number(invoice.igstAmount || invoice.totals.igst || 0);
  const isIntraState = cgstVal > 0 || sgstVal > 0;

  // 1. Top Decorative Brand Bar
  fillRect(left, 764, pageWidth, 5, isGst ? 0.06 : 0.24, isGst ? 0.58 : 0.32, isGst ? 0.36 : 0.96);

  // 2. Header Section
  // Monogram Logo Badge
  const monogram = (invoice.business.name || "BF").slice(0, 2).toUpperCase();
  fillRect(left, 706, 42, 42, 0.09, 0.11, 0.19);
  addText(left + 9, 718, 16, monogram, true, 1, 1, 1);

  // Business Name & Tagline
  addText(left + 54, 730, 16, invoice.business.name || "Business", true, 0.06, 0.09, 0.16);
  addText(
    left + 54,
    714,
    9,
    isGst
      ? `GSTIN: ${invoice.business.gstin || "REGISTERED"} | PAN: ${invoice.business.pan || "N/A"}`
      : "COMMERCIAL INVOICE",
    false,
    0.35,
    0.40,
    0.50
  );

  // Document Title & Number (Right Side)
  addRightText(right, 730, 20, isGst ? "TAX INVOICE" : "INVOICE", true, 0.06, 0.09, 0.16);
  // Invoice Number Chip
  const invNum = `#${invoice.number}`;
  const invNumW = textWidth(invNum, 10, true) + 16;
  fillRect(right - invNumW, 707, invNumW, 18, 0.94, 0.96, 0.98);
  strokeRect(right - invNumW, 707, invNumW, 18, 0.82, 0.86, 0.91, 0.8);
  addRightText(right - 8, 712, 10, invNum, true, 0.15, 0.20, 0.30);

  // Status Stamp Badge
  const normStatus = (invoice.status || "DRAFT").toUpperCase();
  let badgeFill = [0.93, 0.95, 0.98];
  let badgeStroke = [0.8, 0.85, 0.92];
  let badgeTextColor = [0.25, 0.3, 0.4];
  let badgeLabel = normStatus;

  if (normStatus === "PAID") {
    badgeFill = [0.88, 0.97, 0.92];
    badgeStroke = [0.55, 0.88, 0.68];
    badgeTextColor = [0.06, 0.5, 0.28];
    badgeLabel = "PAID IN FULL";
  } else if (normStatus === "OVERDUE") {
    badgeFill = [0.99, 0.92, 0.92];
    badgeStroke = [0.96, 0.62, 0.62];
    badgeTextColor = [0.72, 0.15, 0.15];
    badgeLabel = "PAYMENT OVERDUE";
  } else if (normStatus === "SENT") {
    badgeFill = [0.91, 0.95, 1.0];
    badgeStroke = [0.65, 0.78, 0.98];
    badgeTextColor = [0.12, 0.35, 0.78];
    badgeLabel = "AWAITING PAYMENT";
  }

  const badgeW = textWidth(badgeLabel, 8.5, true) + 18;
  fillRect(right - badgeW, 680, badgeW, 18, badgeFill[0], badgeFill[1], badgeFill[2]);
  strokeRect(right - badgeW, 680, badgeW, 18, badgeStroke[0], badgeStroke[1], badgeStroke[2], 0.75);
  addRightText(right - 9, 685, 8.5, badgeLabel, true, badgeTextColor[0], badgeTextColor[1], badgeTextColor[2]);

  // Subtle Header Divider
  drawLine(left, 666, right, 666, 0.88, 0.91, 0.94, 1);

  // 3. Info Cards Grid (y: 565 to 655)
  // Left: Bill To
  fillRect(left, 565, 255, 90, 0.98, 0.99, 1.0);
  strokeRect(left, 565, 255, 90, 0.9, 0.92, 0.96, 0.8);
  fillRect(left, 637, 255, 18, 0.93, 0.95, 0.98);
  addText(left + 12, 642, 8, "BILLED TO (BUYER)", true, 0.35, 0.4, 0.5);

  addText(left + 12, 622, 10.5, invoice.client.name, true, 0.08, 0.11, 0.18);
  let billY = 608;
  if (invoice.client.company) {
    addText(left + 12, billY, 8.5, invoice.client.company, false, 0.28, 0.33, 0.42);
    billY -= 12;
  }
  if (invoice.client.gstin) {
    addText(left + 12, billY, 8, `GSTIN: ${invoice.client.gstin}`, true, 0.06, 0.48, 0.28);
    billY -= 12;
  }
  addText(left + 12, billY, 8, invoice.client.email, false, 0.38, 0.43, 0.52);
  if (invoice.client.address && billY > 575) {
    billY -= 11;
    addText(left + 12, billY, 7.5, invoice.client.address.replace(/\r?\n/g, ", ").slice(0, 48), false, 0.45, 0.5, 0.58);
  }

  // Right: Invoice Particulars & Supply Metadata
  fillRect(right - 245, 565, 245, 90, 0.98, 0.99, 1.0);
  strokeRect(right - 245, 565, 245, 90, 0.9, 0.92, 0.96, 0.8);
  fillRect(right - 245, 637, 245, 18, 0.93, 0.95, 0.98);
  addText(right - 233, 642, 8, "INVOICE PARTICULARS", true, 0.35, 0.4, 0.5);

  addText(right - 233, 621, 8.5, "Issue Date:", false, 0.4, 0.45, 0.55);
  addRightText(right - 12, 621, 8.5, formatDate(invoice.issueDate), true, 0.08, 0.11, 0.18);

  addText(right - 233, 606, 8.5, "Due Date:", false, 0.4, 0.45, 0.55);
  addRightText(
    right - 12,
    606,
    8.5,
    formatDate(invoice.dueDate),
    true,
    normStatus === "OVERDUE" ? 0.75 : 0.08,
    0.11,
    0.18
  );

  if (isGst && invoice.placeOfSupply) {
    addText(right - 233, 591, 8, "Place of Supply:", false, 0.4, 0.45, 0.55);
    addRightText(right - 12, 591, 8, invoice.placeOfSupply.slice(0, 24), true, 0.15, 0.2, 0.3);
  } else {
    addText(right - 233, 591, 8.5, "Currency:", false, 0.4, 0.45, 0.55);
    addRightText(right - 12, 591, 8.5, invoice.business.currency || "INR", true, 0.2, 0.25, 0.35);
  }

  if (isGst) {
    addText(right - 233, 576, 7.5, "Tax Nature:", false, 0.45, 0.5, 0.58);
    addRightText(right - 12, 576, 7.5, isIntraState ? "Intra-State (CGST+SGST)" : "Inter-State (IGST)", true, 0.1, 0.35, 0.25);
  }

  // 4. Line Items Table
  const tableTop = 540;
  const colDesc = left + 12;
  const colHsn = isGst ? 310 : 310;
  const colQty = 370;
  const colRate = 450;
  const colAmount = right - 12;

  // Header Row
  fillRect(left, tableTop - 22, pageWidth, 22, 0.1, 0.13, 0.2);
  addText(colDesc, tableTop - 15, 8, "DESCRIPTION", true, 0.92, 0.94, 0.98);
  if (isGst) addText(colHsn - 35, tableTop - 15, 8, "HSN/SAC", true, 0.92, 0.94, 0.98);
  addRightText(colQty, tableTop - 15, 8, "QTY", true, 0.92, 0.94, 0.98);
  addRightText(colRate, tableTop - 15, 8, "RATE", true, 0.92, 0.94, 0.98);
  addRightText(colAmount, tableTop - 15, 8, "AMOUNT", true, 0.92, 0.94, 0.98);

  let currentY = tableTop - 22;
  let rowIndex = 0;

  for (const item of invoice.lineItems) {
    if (currentY < 200) break;
    const rowH = 22;
    currentY -= rowH;

    if (rowIndex % 2 === 1) {
      fillRect(left, currentY, pageWidth, rowH, 0.97, 0.98, 0.99);
    }
    drawLine(left, currentY, right, currentY, 0.91, 0.93, 0.95, 0.7);

    const qty = Number(item.quantity) || 1;
    const rate = Number(item.rate) || 0;
    const amount = qty * rate;

    addText(colDesc, currentY + 7, 8.5, item.description.slice(0, 36), false, 0.1, 0.13, 0.2);
    if (isGst) {
      addText(colHsn - 35, currentY + 7, 8, (item.hsnSac || "—").slice(0, 10), false, 0.35, 0.4, 0.5);
    }
    addRightText(colQty, currentY + 7, 8.5, String(qty), false, 0.3, 0.35, 0.45);
    addRightText(colRate, currentY + 7, 8.5, formatPdfMoney(rate, invoice.business.currency), false, 0.3, 0.35, 0.45);
    addRightText(colAmount, currentY + 7, 8.5, formatPdfMoney(amount, invoice.business.currency), true, 0.08, 0.11, 0.18);

    rowIndex++;
  }

  // 5. Bottom Section: Bank / Notes & Summary
  const summaryTop = currentY - 18;

  // Left Column: Settlement & Wire Transfer Box
  const notesBoxW = 265;
  const notesBoxH = 105;
  fillRect(left, summaryTop - notesBoxH, notesBoxW, notesBoxH, 0.98, 0.99, 1.0);
  strokeRect(left, summaryTop - notesBoxH, notesBoxW, notesBoxH, 0.88, 0.91, 0.94, 0.8);
  fillRect(left, summaryTop - notesBoxH, 4, notesBoxH, isGst ? 0.06 : 0.24, isGst ? 0.58 : 0.32, isGst ? 0.36 : 0.96);

  addText(left + 12, summaryTop - 16, 8, "SETTLEMENT & PAYMENT INSTRUCTIONS", true, 0.35, 0.4, 0.5);
  let noteY = summaryTop - 30;

  if (invoice.business.bankName || invoice.business.bankAccountNo) {
    if (invoice.business.bankName) {
      addText(left + 12, noteY, 8, `Bank: ${invoice.business.bankName}`, true, 0.15, 0.2, 0.3);
      noteY -= 11;
    }
    if (invoice.business.bankAccountNo) {
      addText(left + 12, noteY, 8, `A/C No: ${invoice.business.bankAccountNo}`, false, 0.2, 0.25, 0.35);
      noteY -= 11;
    }
    if (invoice.business.bankIfsc) {
      addText(left + 12, noteY, 8, `IFSC: ${invoice.business.bankIfsc}`, false, 0.2, 0.25, 0.35);
      noteY -= 11;
    }
    if (invoice.business.upiId) {
      addText(left + 12, noteY, 8, `UPI ID: ${invoice.business.upiId}`, true, 0.1, 0.45, 0.25);
      noteY -= 11;
    }
  } else if (invoice.notes) {
    const noteLines = invoice.notes.split(/\r?\n/).slice(0, 4);
    for (const nl of noteLines) {
      addText(left + 12, noteY, 8, nl.slice(0, 48), false, 0.25, 0.3, 0.4);
      noteY -= 11;
    }
  } else {
    addText(left + 12, noteY, 8, "Please pay by the due date mentioned above.", false, 0.3, 0.35, 0.45);
  }

  // Right Column: Financial Totals Box
  const summaryBoxW = 230;
  const summaryBoxLeft = right - summaryBoxW;
  let sumY = summaryTop;

  // Subtotal
  addText(summaryBoxLeft + 10, sumY - 12, 8.5, "Taxable Subtotal", false, 0.38, 0.43, 0.52);
  addRightText(right - 10, sumY - 12, 8.5, formatPdfMoney(invoice.totals.subtotal, invoice.business.currency), false, 0.1, 0.13, 0.2);
  sumY -= 17;

  // Discount
  const discountRate = Number(invoice.discountRate) || 0;
  if (discountRate > 0 || invoice.totals.discount > 0) {
    addText(summaryBoxLeft + 10, sumY - 12, 8.5, `Discount (${discountRate.toFixed(1)}%)`, false, 0.38, 0.43, 0.52);
    addRightText(right - 10, sumY - 12, 8.5, `-${formatPdfMoney(invoice.totals.discount, invoice.business.currency)}`, false, 0.7, 0.15, 0.15);
    sumY -= 17;
  }

  // Tax Breakdown
  if (isGst) {
    if (isIntraState) {
      addText(summaryBoxLeft + 10, sumY - 12, 8, "Central Tax (CGST)", false, 0.38, 0.43, 0.52);
      addRightText(right - 10, sumY - 12, 8, formatPdfMoney(cgstVal, invoice.business.currency), false, 0.1, 0.13, 0.2);
      sumY -= 15;

      addText(summaryBoxLeft + 10, sumY - 12, 8, "State Tax (SGST)", false, 0.38, 0.43, 0.52);
      addRightText(right - 10, sumY - 12, 8, formatPdfMoney(sgstVal, invoice.business.currency), false, 0.1, 0.13, 0.2);
      sumY -= 15;
    } else {
      addText(summaryBoxLeft + 10, sumY - 12, 8, "Integrated Tax (IGST)", false, 0.38, 0.43, 0.52);
      addRightText(right - 10, sumY - 12, 8, formatPdfMoney(igstVal, invoice.business.currency), false, 0.1, 0.13, 0.2);
      sumY -= 15;
    }
  } else {
    const taxRate = Number(invoice.taxRate) || 0;
    if (taxRate > 0 || invoice.totals.tax > 0) {
      addText(summaryBoxLeft + 10, sumY - 12, 8.5, `Tax (${taxRate.toFixed(1)}%)`, false, 0.38, 0.43, 0.52);
      addRightText(right - 10, sumY - 12, 8.5, formatPdfMoney(invoice.totals.tax, invoice.business.currency), false, 0.1, 0.13, 0.2);
      sumY -= 17;
    }
  }

  // Highlighted Total Due Box
  sumY -= 6;
  const totalBoxH = 30;
  fillRect(summaryBoxLeft, sumY - totalBoxH, summaryBoxW, totalBoxH, 0.09, 0.12, 0.2);
  addText(summaryBoxLeft + 10, sumY - 19, 9.5, "Total Amount Due", true, 0.9, 0.93, 0.98);
  addRightText(right - 10, sumY - 19, 12, formatPdfMoney(invoice.totals.total, invoice.business.currency), true, 1.0, 1.0, 1.0);

  // 6. Professional Executive Footer
  const footerY = 44;
  drawLine(left, footerY + 14, right, footerY + 14, 0.88, 0.91, 0.94, 0.8);
  addText(
    left,
    footerY,
    8,
    isGst
      ? "Computer Generated GST Tax Invoice • Subject to Jurisdictional Courts • No signature required"
      : "Thank you for your business! Please settle within the agreed payment schedule.",
    false,
    0.45,
    0.5,
    0.58
  );
  addRightText(right, footerY, 7.5, "Generated via BillFlow Workspace | Page 1 of 1", false, 0.55, 0.6, 0.68);

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
