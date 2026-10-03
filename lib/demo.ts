import { PrismaClient, InvoiceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

function daysFromNow(days: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

export async function ensureDemoUser() {
  const email = "demo@billflow.app";
  const password = "Demo@12345";
  const passwordHash = await bcrypt.hash(password, 10);

  // Check if demo user already exists with invoices
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { _count: { select: { invoices: true } } },
  });

  if (existingUser && existingUser._count.invoices > 0) {
    return existingUser;
  }

  // Create or update demo organization user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name: "Alex Morgan",
      businessName: "Northstar Technologies & Design",
      currency: "INR",
      invoicePrefix: "NST",
      invoiceSequence: 1004,
      plan: "ORGANIZATION",
      planStatus: "ACTIVE",
      planPeriod: "MONTHLY",
      isGstRegistered: true,
      gstin: "09AAACB2024D1Z5",
      pan: "AAACB2024D",
      state: "Uttar Pradesh",
      stateCode: "09",
      businessAddress: "42 Civil Lines, Kanpur, Uttar Pradesh 208001",
      bankName: "HDFC Bank",
      bankAccountNo: "50200088991122",
      bankIfsc: "HDFC0000216",
      bankBranch: "Mall Road Branch, Kanpur",
      upiId: "northstar@okaxis",
    },
    create: {
      email,
      passwordHash,
      name: "Alex Morgan",
      businessName: "Northstar Technologies & Design",
      currency: "INR",
      invoicePrefix: "NST",
      invoiceSequence: 1004,
      plan: "ORGANIZATION",
      planStatus: "ACTIVE",
      planPeriod: "MONTHLY",
      isGstRegistered: true,
      gstin: "09AAACB2024D1Z5",
      pan: "AAACB2024D",
      state: "Uttar Pradesh",
      stateCode: "09",
      businessAddress: "42 Civil Lines, Kanpur, Uttar Pradesh 208001",
      bankName: "HDFC Bank",
      bankAccountNo: "50200088991122",
      bankIfsc: "HDFC0000216",
      bankBranch: "Mall Road Branch, Kanpur",
      upiId: "northstar@okaxis",
    },
  });

  // Clean existing demo data if any partial state exists
  await prisma.invoiceLineItem.deleteMany({ where: { invoice: { userId: user.id } } });
  await prisma.invoice.deleteMany({ where: { userId: user.id } });
  await prisma.client.deleteMany({ where: { userId: user.id } });

  // Create standard demo clients
  const acme = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Priya Shah",
      email: "priya@acme-retail.in",
      company: "Acme Retail Technologies Pvt Ltd",
      phone: "+91 98765 43210",
      address: "12 MG Road, Bengaluru, Karnataka 560001",
      gstin: "29AABCA1122B1Z8",
      state: "Karnataka",
      stateCode: "29",
    },
  });

  const vertex = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Arjun Mehta",
      email: "arjun@vertexlabs.io",
      company: "Vertex Cloud Labs LLP",
      phone: "+91 99887 66554",
      address: "23 Banjara Hills, Hyderabad, Telangana 500034",
      gstin: "36AABCV3344C1Z9",
      state: "Telangana",
      stateCode: "36",
    },
  });

  const kanpurDigital = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Rohit Agarwal",
      email: "rohit@kanpurdigital.com",
      company: "Kanpur Digital Solutions",
      phone: "+91 94150 12345",
      address: "15 Swaroop Nagar, Kanpur, Uttar Pradesh 208002",
      gstin: "09AABCK5566D1Z1",
      state: "Uttar Pradesh",
      stateCode: "09",
    },
  });

  const createInvoice = async (args: any) =>
    prisma.invoice.create({
      data: {
        userId: user.id,
        clientId: args.clientId,
        number: args.number,
        issueDate: args.issueDate,
        dueDate: args.dueDate,
        notes: args.notes,
        taxRate: args.taxRate,
        discountRate: args.discountRate,
        isGstInvoice: args.isGstInvoice ?? true,
        placeOfSupply: args.placeOfSupply,
        cgstAmount: args.cgstAmount ?? 0,
        sgstAmount: args.sgstAmount ?? 0,
        igstAmount: args.igstAmount ?? 0,
        status: args.status,
        publicToken: args.publicToken || randomBytes(24).toString("hex"),
        sentAt: args.status !== InvoiceStatus.DRAFT ? args.issueDate : null,
        paidAt: args.status === InvoiceStatus.PAID ? daysFromNow(-8) : null,
        lineItems: { create: args.items },
      },
      include: { lineItems: true },
    });

  // 1. Paid Inter-State Invoice
  await createInvoice({
    clientId: acme.id,
    number: "NST-1001",
    issueDate: daysFromNow(-20),
    dueDate: daysFromNow(-5),
    taxRate: 18,
    discountRate: 5,
    isGstInvoice: true,
    placeOfSupply: "29 - Karnataka",
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 9747,
    status: InvoiceStatus.PAID,
    notes: "Official GST Tax Invoice. Payment settled in full via NEFT/RTGS.",
    items: [
      { description: "E-commerce UI/UX Architecture", quantity: 1, rate: 45000, hsnSac: "998311", gstRate: 18 },
      { description: "Figma Design System Handoff", quantity: 1, rate: 12000, hsnSac: "998314", gstRate: 18 },
    ],
  });

  // 2. Sent Intra-State Invoice with fixed demo public token
  await createInvoice({
    clientId: kanpurDigital.id,
    number: "NST-1002",
    publicToken: "demo-nst-1002-public",
    issueDate: daysFromNow(-8),
    dueDate: daysFromNow(12),
    taxRate: 18,
    discountRate: 0,
    isGstInvoice: true,
    placeOfSupply: "09 - Uttar Pradesh",
    cgstAmount: 5670,
    sgstAmount: 5670,
    igstAmount: 0,
    status: InvoiceStatus.SENT,
    notes: "Intra-state supply under UP GST. Please transfer to our HDFC Bank account.",
    items: [
      { description: "Next.js Web Portal Development", quantity: 3, rate: 18000, hsnSac: "998314", gstRate: 18 },
      { description: "Cloud Infrastructure Setup & CI/CD", quantity: 1, rate: 9000, hsnSac: "998313", gstRate: 18 },
    ],
  });

  // 3. Sent Inter-State Invoice
  await createInvoice({
    clientId: vertex.id,
    number: "NST-1003",
    issueDate: daysFromNow(-3),
    dueDate: daysFromNow(14),
    taxRate: 18,
    discountRate: 0,
    isGstInvoice: true,
    placeOfSupply: "36 - Telangana",
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 10080,
    status: InvoiceStatus.SENT,
    notes: "Inter-state supply. Remit via IMPS or wire transfer.",
    items: [
      { description: "Enterprise Cloud Security Review", quantity: 1, rate: 56000, hsnSac: "998316", gstRate: 18 },
    ],
  });

  // 4. Draft Invoice
  await createInvoice({
    clientId: kanpurDigital.id,
    number: "NST-1004",
    issueDate: daysFromNow(0),
    dueDate: daysFromNow(14),
    taxRate: 18,
    discountRate: 0,
    isGstInvoice: true,
    placeOfSupply: "09 - Uttar Pradesh",
    cgstAmount: 2700,
    sgstAmount: 2700,
    igstAmount: 0,
    status: InvoiceStatus.DRAFT,
    notes: "Draft for monthly maintenance retainer.",
    items: [
      { description: "Monthly Dedicated Tech Retainer", quantity: 1, rate: 30000, hsnSac: "998314", gstRate: 18 },
    ],
  });

  return user;
}
