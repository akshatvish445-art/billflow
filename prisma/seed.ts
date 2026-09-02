import { PrismaClient, InvoiceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

function daysFromNow(days: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  const email = "demo@billflow.app";
  const password = "Demo@12345";
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, businessName: "Northstar Studio", currency: "INR", invoicePrefix: "NST", invoiceSequence: 1000 },
    create: {
      email,
      passwordHash,
      name: "Alex Morgan",
      businessName: "Northstar Studio",
      currency: "INR",
      invoicePrefix: "NST",
    },
  });

  await prisma.invoiceLineItem.deleteMany({ where: { invoice: { userId: user.id } } });
  await prisma.invoice.deleteMany({ where: { userId: user.id } });
  await prisma.client.deleteMany({ where: { userId: user.id } });

  const clients = await prisma.client.createManyAndReturn({
    data: [
      { userId: user.id, name: "Priya Shah", email: "priya@acme-retail.in", company: "Acme Retail", phone: "+91 98765 43210", address: "12 MG Road, Bengaluru, Karnataka" },
      { userId: user.id, name: "Arjun Mehta", email: "arjun@vertexlabs.io", company: "Vertex Labs", phone: "+91 99887 66554", address: "23 Banjara Hills, Hyderabad, Telangana" },
      { userId: user.id, name: "Sarah Lim", email: "sarah@orbit.co", company: "Orbit & Co.", phone: "+65 8123 4567", address: "8 Raffles Avenue, Singapore" },
    ],
  });

  const [acme, vertex, orbit] = clients;

  const createInvoice = async (args: any) => prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: args.clientId,
      number: args.number,
      issueDate: args.issueDate,
      dueDate: args.dueDate,
      notes: args.notes,
      taxRate: args.taxRate,
      discountRate: args.discountRate,
      status: args.status,
      publicToken: args.publicToken || randomBytes(24).toString("hex"),
      sentAt: args.status !== InvoiceStatus.DRAFT ? args.issueDate : null,
      paidAt: args.status === InvoiceStatus.PAID ? daysFromNow(-8) : null,
      lineItems: { create: args.items },
    },
    include: { lineItems: true },
  });

  await createInvoice({
    clientId: acme.id,
    number: "NST-1001",
    issueDate: daysFromNow(-20), dueDate: daysFromNow(-5), taxRate: 18, discountRate: 5, status: InvoiceStatus.PAID,
    notes: "Thank you for trusting Northstar Studio.",
    items: [
      { description: "E-commerce UI/UX design", quantity: 1, rate: 45000 },
      { description: "Design system handoff", quantity: 1, rate: 12000 },
    ],
  });
  await createInvoice({
    clientId: vertex.id,
    number: "NST-1002",
    publicToken: "demo-nst-1002-public",
    issueDate: daysFromNow(-9), dueDate: daysFromNow(10), taxRate: 18, discountRate: 0, status: InvoiceStatus.SENT,
    notes: "Net 10 payment terms.",
    items: [
      { description: "Website development sprint", quantity: 3, rate: 18000 },
      { description: "Deployment & QA", quantity: 1, rate: 9000 },
    ],
  });
  await createInvoice({
    clientId: orbit.id,
    number: "NST-1003",
    issueDate: daysFromNow(-35), dueDate: daysFromNow(-15), taxRate: 0, discountRate: 0, status: InvoiceStatus.SENT,
    notes: "Please settle this invoice at your earliest convenience.",
    items: [{ description: "Brand identity package", quantity: 1, rate: 56000 }],
  });
  await createInvoice({
    clientId: acme.id,
    number: "NST-1004",
    issueDate: daysFromNow(-2), dueDate: daysFromNow(12), taxRate: 18, discountRate: 0, status: InvoiceStatus.DRAFT,
    notes: "Draft prepared for approval.",
    items: [{ description: "Monthly design retainer", quantity: 1, rate: 30000 }],
  });

  await prisma.user.update({ where: { id: user.id }, data: { invoiceSequence: 1004 } });
  console.log(`Demo account ready: ${email} / ${password}`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
