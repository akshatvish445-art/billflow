import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import InvoiceForm from "@/components/InvoiceForm";
export default async function NewInvoicePage(){const user=await requireUser();const clients=await prisma.client.findMany({where:{userId:user.id},orderBy:{name:"asc"}});return <InvoiceForm mode="create" clients={clients} currency={user.currency} />}
